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
  createPartnerAccount: (email: string, password: string, partnerData: any) => Promise<void>;
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
    // Clear all caches and stored data
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    
    // Clear any service worker caches if PWA is active
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service worker caches cleared');
      } catch (error) {
        console.error('Error clearing service worker caches:', error);
      }
    }
    
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
      role: Role.COMPANY_ADMIN,
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
      role: Role.COMPANY_ADMIN,
      ...customerData,
      createdAt: new Date().toISOString(),
    });
  };

  const createPartnerAccount = async (email: string, password: string, partnerData: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Prepare user data for both collections
    const userData = {
      userId: user.uid,
      email: user.email,
      role: Role.PARTNER,
      ...partnerData,
      createdAt: new Date().toISOString(),
    };
    
    // Store in company-specific users collection (existing logic)
    const userDocRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${partnerData.companyId}/users/${user.uid}`);
    await setDoc(userDocRef, userData);
    
    // Store in common users collection for faster login lookup
    const commonUserDocRef = doc(db, `Easy2Solutions/companyDirectory/users/${user.uid}`);
    await setDoc(commonUserDocRef, userData);
  };

  const fetchUserInfo = async (user: User) => {
    try {
      console.log('Fetching user info for:', user.uid, 'email:', user.email);

      // Check localStorage first - but only if it matches the current user
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        const userData = JSON.parse(storedUserInfo);
        if (userData.userId === user.uid) {
          console.log('Found matching stored user info:', userData);
          setUserInfo(userData);
          return;
        } else {
          console.log('Stored user info is for different user, clearing cache. Stored userId:', userData.userId, 'Current userId:', user.uid);
          localStorage.removeItem('userInfo');
        }
      }      // Check superAdmin path first
      const superAdminDocRef = doc(db, `Easy2Solutions/companyDirectory/superAdmins/${user.uid}`);
      const superAdminSnapshot = await getDoc(superAdminDocRef);

      if (superAdminSnapshot.exists()) {
        console.log('User is super admin');
        const userInfoData: UserInfo = {
          userId: user.uid,
          companyId: null,
          role: Role.COMPANY_ADMIN,
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
          role: userData.role || Role.COMPANY_ADMIN,
          userName: userData.userName || user.displayName || '',
          email: userData.email || user.email || '',
          name: userData.name || user.displayName || '',
          mobileNumber: userData.mobileNumber,
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
            role: userData.role || Role.COMPANY_ADMIN,
            userName: userData.userName || user.displayName || '',
            email: userData.email || user.email || '',
            name: userData.name || user.displayName || '',
            mobileNumber: userData.mobileNumber,
            address: userData.address,
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
        console.log('No authenticated user found');
        // Clear user info when logged out
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
    createPartnerAccount,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
