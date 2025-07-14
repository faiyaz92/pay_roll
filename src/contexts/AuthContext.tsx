
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { UserInfo, Role } from '@/types/user';

interface AuthContextType {
  currentUser: User | null;
  userInfo: UserInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  const fetchUserInfo = async (user: User) => {
    try {
      // Check localStorage first
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        const userData = JSON.parse(storedUserInfo);
        setUserInfo(userData);
        return;
      }

      // Check superAdmin path first
      const superAdminDocRef = doc(db, `Easy2Solutions/companyDirectory/superAdmins/${user.uid}`);
      const superAdminSnapshot = await getDoc(superAdminDocRef);

      if (superAdminSnapshot.exists()) {
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
        const userData = querySnapshot.docs[0].data();
        const userInfoData: UserInfo = {
          userId: userData.userId || user.uid,
          companyId: userData.companyId || null,
          role: userData.role || Role.COMPANY_ADMIN,
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
      } else {
        throw new Error('User not found in any Tenant Company.');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
