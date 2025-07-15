import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where, limit, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { UserInfo, Role } from '@/types/user';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  currentUser: User | null;
  userInfo: UserInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  createDriverAccount: (email: string, password: string, driverData: any) => Promise<void>;
  createCustomerAccount: (email: string, password: string, customerData: any) => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    return signOut(auth);
  };

  const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const createDriverAccount = async (email: string, password: string, driverData: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    const userDocRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${driverData.companyId}/users/${user.uid}`);
    await setDoc(userDocRef, {
      userId: user.uid,
      email: user.email,
      role: Role.DRIVER,
      ...driverData,
      createdAt: new Date().toISOString(),
    });
  };

  const createCustomerAccount = async (email: string, password: string, customerData: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in common users collection
    const userDocRef = doc(db, `Easy2Solutions/companyDirectory/users/${user.uid}`);
    await setDoc(userDocRef, {
      userId: user.uid,
      email: user.email,
      role: Role.CUSTOMER,
      ...customerData,
      createdAt: new Date().toISOString(),
    });
  };

  const fetchUserInfo = async (user: User) => {
    try {
      console.log('Fetching user info for:', user.uid);
      
      // Check localStorage first
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        const userData = JSON.parse(storedUserInfo);
        console.log('Found stored user info:', userData);
        setUserInfo(userData);
        return;
      }

      // Check superAdmin path first
      const superAdminDocRef = doc(db, `Easy2Solutions/companyDirectory/superAdmins/${user.uid}`);
      const superAdminSnapshot = await getDoc(superAdminDocRef);

      if (superAdminSnapshot.exists()) {
        console.log('User is super admin');
        const userInfoData: UserInfo = {
          userId: user.uid,
          companyId: null,
          role: Role.SUPER_ADMIN,
          userName: user.displayName || '',
          email: user.email || '',
          name: user.displayName || '',
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfoData));
        setUserInfo(userInfoData);
        return;
      }

      // Check common users path
      const usersQuery = query(
        collection(db, 'Easy2Solutions/companyDirectory/users'),
        where('userId', '==', user.uid),
        limit(1)
      );
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        console.log('Found user in common users');
        const userData = querySnapshot.docs[0].data();
        const userInfoData: UserInfo = {
          userId: userData.userId || user.uid,
          companyId: userData.companyId || null,
          role: userData.role || Role.CUSTOMER,
          userName: userData.userName || user.displayName || '',
          email: userData.email || user.email || '',
          name: userData.name || user.displayName || '',
          userType: userData.userType,
          latitude: userData.latitude,
          longitude: userData.longitude,
          dailyWage: userData.dailyWage,
          mobileNumber: userData.mobileNumber,
          businessName: userData.businessName,
          address: userData.address,
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfoData));
        setUserInfo(userInfoData);
        return;
      }

      // Check in all tenant companies for drivers and company admins
      const companiesRef = collection(db, 'Easy2Solutions/companyDirectory/tenantCompanies');
      const companiesSnapshot = await getDocs(companiesRef);
      
      for (const companyDoc of companiesSnapshot.docs) {
        const companyId = companyDoc.id;
        
        // Check users in this company
        const companyUsersRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users`);
        const userDoc = doc(companyUsersRef, user.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (userSnapshot.exists()) {
          console.log('Found user in company:', companyId);
          const userData = userSnapshot.data();
          const userInfoData: UserInfo = {
            userId: userData.userId || user.uid,
            companyId: companyId,
            role: userData.role || Role.DRIVER,
            userName: userData.userName || user.displayName || '',
            email: userData.email || user.email || '',
            name: userData.name || user.displayName || '',
            userType: userData.userType,
            latitude: userData.latitude,
            longitude: userData.longitude,
            dailyWage: userData.dailyWage,
            mobileNumber: userData.mobileNumber,
            businessName: userData.businessName,
            address: userData.address,
            licenseNumber: userData.licenseNumber,
            vehicleAssigned: userData.vehicleAssigned,
            employeeId: userData.employeeId,
            department: userData.department,
            isActive: userData.isActive,
          };
          localStorage.setItem('userInfo', JSON.stringify(userInfoData));
          setUserInfo(userInfoData);
          return;
        }
      }

      console.error('User not found in any collection.');
      throw new Error('User not found in any collection.');
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid || 'null');
      
      if (user) {
        await fetchUserInfo(user);
      } else {
        setUserInfo(null);
        localStorage.removeItem('userInfo');
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userInfo,
    login,
    logout,
    resetPassword,
    createDriverAccount,
    createCustomerAccount,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
