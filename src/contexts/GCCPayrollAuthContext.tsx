import React, { createContext, useContext, useEffect, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, collection, addDoc, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { createAuthUser } from '@/config/firebaseSecondary';
import { UserInfo, Role, EmployeeInfo } from '@/types/user';
import { useAuthStore } from '@/stores';

type EmployeeOnboardingInput = Partial<EmployeeInfo> & {
  preferredLanguage?: 'en' | 'ar';
  rtlEnabled?: boolean;
};

interface AuthContextType {
  currentUser: User | null;
  userInfo: UserInfo | null;
  employeeInfo: EmployeeInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  createHRUser: (email: string, password: string, hrData: Partial<UserInfo>) => Promise<UserInfo>;
  createEmployeeUser: (
    email: string,
    password: string,
    employeeData: EmployeeOnboardingInput
  ) => Promise<{ user: UserInfo; employee: EmployeeInfo }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useAuthStore((state) => state.firebaseUser);
  const userInfo = useAuthStore((state) => state.userInfo);
  const employeeInfo = useAuthStore((state) => state.employeeInfo);
  const loading = useAuthStore((state) => state.loading);
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setUserInfo = useAuthStore((state) => state.setUserInfo);
  const setEmployeeInfo = useAuthStore((state) => state.setEmployeeInfo);
  const setLoading = useAuthStore((state) => state.setLoading);
  const resetAuthState = useAuthStore((state) => state.reset);

  // Real Firebase Auth login only — no auto-provisioning fallback.
  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      setFirebaseUser(userCredential.user);
      await fetchUserData(userCredential.user);
    }
  };

  const logout = async () => {
    // Log session end - Must match Database-Info Section 2 /user_sessions
    if (userInfo) {
      await logUserSession(userInfo.uid, userInfo.companyId, 'logout');
    }

    // Clear caches
    localStorage.removeItem('userInfo');
    localStorage.removeItem('employeeInfo');

    resetAuthState();

    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Company Admin creates HR users — writes to flat top-level `users` collection
  const createHRUser = async (email: string, password: string, hrData: Partial<UserInfo>) => {
    if (!userInfo || userInfo.role !== Role.COMPANY_ADMIN) {
      throw new Error('Only company admins can create HR users');
    }

    const displayName = hrData.displayName?.trim() || email;
    const preferredLanguage = hrData.preferredLanguage ?? 'en';
    const rtlEnabled = hrData.rtlEnabled ?? preferredLanguage === 'ar';

    const { uid } = await createAuthUser(email, password);
    const now = new Date();

    const userDocData: UserInfo = {
      uid,
      email,
      displayName,
      role: Role.HR_MANAGER,
      companyId: userInfo.companyId,
      status: 'active',
      createdBy: userInfo.uid,
      createdAt: now,
      updatedAt: now,
      preferredLanguage,
      rtlEnabled
    };

    await setDoc(doc(db, 'users', uid), userDocData);

    await logAuditTrail(userInfo.uid, 'create', 'user', uid, null, userDocData as unknown as Record<string, unknown>);

    return userDocData;
  };

  // Company Admin / HR Manager onboards a new employee — writes to flat
  // top-level `users` + `employees` collections and seeds a default leave
  // balance so the employee has real data from day one.
  const createEmployeeUser = async (email: string, password: string, employeeData: EmployeeOnboardingInput) => {
    if (!userInfo || (userInfo.role !== Role.COMPANY_ADMIN && userInfo.role !== Role.HR_MANAGER)) {
      throw new Error('Only company admins and HR managers can create employee users');
    }

    const preferredLanguage: 'en' | 'ar' = employeeData.preferredLanguage ?? 'en';
    const { uid } = await createAuthUser(email, password);

    const employeeId = `EMP${Date.now()}`;
    const now = new Date();

    const fullName = (employeeData.personal?.fullName ?? `${employeeData.personal?.firstName ?? ''} ${employeeData.personal?.lastName ?? ''}`).trim();
    const sanitizedFullName = fullName || email;

    const userDocData: UserInfo = {
      uid,
      email,
      displayName: sanitizedFullName,
      role: Role.EMPLOYEE,
      employeeId,
      companyId: userInfo.companyId,
      status: 'active',
      createdBy: userInfo.uid,
      createdAt: now,
      updatedAt: now,
      preferredLanguage,
      rtlEnabled: employeeData.rtlEnabled ?? preferredLanguage === 'ar'
    };

    await setDoc(doc(db, 'users', uid), userDocData);

    const personal: EmployeeInfo['personal'] = {
      firstName: employeeData.personal?.firstName ?? '',
      lastName: employeeData.personal?.lastName ?? '',
      fullName: sanitizedFullName,
      dateOfBirth: employeeData.personal?.dateOfBirth ?? now,
      gender: employeeData.personal?.gender ?? 'male',
      nationality: employeeData.personal?.nationality ?? '',
      maritalStatus: employeeData.personal?.maritalStatus ?? 'single',
      dependents: employeeData.personal?.dependents ?? 0
    };

    const employment: EmployeeInfo['employment'] = {
      department: employeeData.employment?.department ?? '',
      designation: employeeData.employment?.designation ?? '',
      grade: employeeData.employment?.grade ?? '',
      costCenter: employeeData.employment?.costCenter ?? '',
      officeId: employeeData.employment?.officeId ?? '',
      contractType: employeeData.employment?.contractType ?? 'unlimited',
      startDate: employeeData.employment?.startDate ?? now
    };

    if (employeeData.employment?.probationEndDate) {
      employment.probationEndDate = employeeData.employment.probationEndDate;
    }
    if (employeeData.employment?.managerId) {
      employment.managerId = employeeData.employment.managerId;
    }

    const payroll: EmployeeInfo['payroll'] = {
      basicSalary: employeeData.payroll?.basicSalary ?? 0,
      hra: employeeData.payroll?.hra ?? { amount: 0, percentage: 0 },
      transportation: employeeData.payroll?.transportation ?? 0,
      mobile: employeeData.payroll?.mobile ?? 0,
      utilities: employeeData.payroll?.utilities ?? 0,
      otherAllowances: employeeData.payroll?.otherAllowances ?? [],
      overtimeRate: employeeData.payroll?.overtimeRate ?? 0,
      currency: employeeData.payroll?.currency ?? 'AED'
    };

    const banking: EmployeeInfo['banking'] = {
      bankName: employeeData.banking?.bankName ?? '',
      branch: employeeData.banking?.branch ?? '',
      iban: employeeData.banking?.iban ?? '',
      swiftCode: employeeData.banking?.swiftCode ?? '',
      accountNumber: employeeData.banking?.accountNumber ?? '',
      routingCode: employeeData.banking?.routingCode ?? ''
    };

    const compliance: EmployeeInfo['compliance'] = {
      emiratesId: employeeData.compliance?.emiratesId ?? '',
      passportNumber: employeeData.compliance?.passportNumber ?? '',
      passportExpiry: employeeData.compliance?.passportExpiry ?? now,
      visaStatus: employeeData.compliance?.visaStatus ?? '',
      labourCardNumber: employeeData.compliance?.labourCardNumber ?? '',
      gosiNumber: employeeData.compliance?.gosiNumber ?? ''
    };

    const gratuity: EmployeeInfo['gratuity'] = {
      eligibilityYears: employeeData.gratuity?.eligibilityYears ?? 1,
      startDate: employeeData.gratuity?.startDate ?? now,
      status: employeeData.gratuity?.status ?? 'not_eligible'
    };

    const employeeDocData: EmployeeInfo = {
      employeeId,
      userId: uid,
      companyId: userInfo.companyId,
      personal,
      employment,
      payroll,
      banking,
      compliance,
      gratuity,
      status: employeeData.status ?? 'active',
      createdBy: userInfo.uid,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(db, 'employees', employeeId), employeeDocData);

    // Seed a default leave balance so the employee has real, working data immediately.
    await setDoc(doc(db, 'leave_balances', employeeId), {
      employeeId,
      annualAccrued: 30,
      annualUsed: 0,
      sickAccrued: 15,
      sickUsed: 0,
      emergencyAccrued: 5,
      emergencyUsed: 0,
      updatedAt: serverTimestamp(),
    });

    await logAuditTrail(userInfo.uid, 'create', 'user', uid, null, userDocData as unknown as Record<string, unknown>);
    await logAuditTrail(userInfo.uid, 'create', 'employee', employeeId, null, employeeDocData as unknown as Record<string, unknown>);

    return { user: userDocData, employee: employeeDocData };
  };

  // Helper: Log user sessions - Must match Database-Info Section 2 /user_sessions
  const logUserSession = async (userId: string, companyId: string, action: 'login' | 'logout') => {
    try {
      const sessionData = {
        userId,
        sessionId: `${userId}_${Date.now()}`,
        ipAddress: '',
        userAgent: navigator.userAgent,
        [action === 'login' ? 'loginTime' : 'logoutTime']: serverTimestamp(),
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'web'
      };

      const sessionRef = collection(db, `companies/${companyId}/user_sessions`);
      await addDoc(sessionRef, sessionData);
    } catch (err) {
      console.warn('Session log notice:', err);
    }
  };

  // Helper: Log audit events - Must match Database-Info Section 11 /audit_logs
  const logAuditTrail = async (
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null
  ) => {
    if (!userInfo) return;

    const auditData = {
      logId: `${entityType}_${entityId}_${Date.now()}`,
      userId,
      action,
      entityType,
      entityId,
      oldData,
      newData,
      ipAddress: '',
      timestamp: serverTimestamp(),
      metadata: {
        userAgent: navigator.userAgent,
        companyId: userInfo.companyId
      }
    };

    const auditRef = collection(db, `companies/${userInfo.companyId}/audit_logs`);
    await addDoc(auditRef, auditData);
  };

  // Helper: Safely convert Firestore timestamps to Date objects
  const convertTimestampToDate = (value: unknown): Date => {
    if (value && typeof value === 'object' && value !== null && 'toDate' in value) {
      const timestampObj = value as { toDate: () => Date };
      if (typeof timestampObj.toDate === 'function') {
        return timestampObj.toDate();
      }
    }
    if (value instanceof Date) {
      return value;
    }
    return new Date(value as string | number | Date);
  };

  // Fetch user (and, for employees, their employee record) — real Firestore
  // data only. No fabricated fallback: an authenticated user with no /users
  // doc is treated as an unprovisioned account, not silently assigned a role.
  const fetchUserData = useCallback(async (user: User) => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      try {
        const cachedUser = JSON.parse(storedUserInfo);
        if (cachedUser.uid === user.uid) {
          useAuthStore.getState().setUserInfo(cachedUser);
          // employeeInfo (office/department/salary assignment) is refetched
          // fresh every load rather than trusted from cache — HR can edit an
          // employee's office at any time, and a stale cached officeId would
          // silently break geofenced check-in until the employee logged out.
          if (cachedUser.role === Role.EMPLOYEE && cachedUser.employeeId) {
            const employeeDocSnap = await getDoc(doc(db, 'employees', cachedUser.employeeId));
            if (employeeDocSnap.exists()) {
              const employeeData = employeeDocSnap.data() as EmployeeInfo;
              employeeData.createdAt = convertTimestampToDate(employeeData.createdAt);
              employeeData.updatedAt = convertTimestampToDate(employeeData.updatedAt);
              localStorage.setItem('employeeInfo', JSON.stringify(employeeData));
              useAuthStore.getState().setEmployeeInfo(employeeData);
            }
          }
          return;
        }
      } catch {
        // ignore cache parse error
      }
    }

    const userDocSnap = await getDoc(doc(db, 'users', user.uid));

    if (!userDocSnap.exists()) {
      await signOut(auth);
      useAuthStore.getState().setUserInfo(null);
      useAuthStore.getState().setEmployeeInfo(null);
      useAuthStore.getState().setFirebaseUser(null);
      throw new Error('Account not fully set up. Contact your HR administrator.');
    }

    const userData = userDocSnap.data() as UserInfo;
    userData.createdAt = convertTimestampToDate(userData.createdAt);
    userData.updatedAt = convertTimestampToDate(userData.updatedAt);

    localStorage.setItem('userInfo', JSON.stringify(userData));
    useAuthStore.getState().setUserInfo(userData);

    if (userData.role === Role.EMPLOYEE && userData.employeeId) {
      const employeeDocSnap = await getDoc(doc(db, 'employees', userData.employeeId));
      if (employeeDocSnap.exists()) {
        const employeeData = employeeDocSnap.data() as EmployeeInfo;
        employeeData.createdAt = convertTimestampToDate(employeeData.createdAt);
        employeeData.updatedAt = convertTimestampToDate(employeeData.updatedAt);
        localStorage.setItem('employeeInfo', JSON.stringify(employeeData));
        useAuthStore.getState().setEmployeeInfo(employeeData);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        useAuthStore.getState().setFirebaseUser(user);
        try {
          await fetchUserData(user);
        } catch (err) {
          console.warn('Auth state user data notice:', err);
        }
      } else {
        useAuthStore.getState().setUserInfo(null);
        useAuthStore.getState().setEmployeeInfo(null);
        useAuthStore.getState().setFirebaseUser(null);
      }

      useAuthStore.getState().setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const value = {
    currentUser,
    userInfo,
    employeeInfo,
    login,
    logout,
    resetPassword,
    createHRUser,
    createEmployeeUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export GCCPayrollAuthProvider as alias for AuthProvider
export const GCCPayrollAuthProvider = AuthProvider;
