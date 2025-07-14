
import { useState, useEffect } from 'react';
import { auth, db } from '@/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { UserInfo, Role } from '@/types/user';

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Check localStorage first
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
          const userData = JSON.parse(storedUserInfo);
          setUserInfo(userData);
          setLoading(false);
          return;
        }

        // If no localStorage data, check Firebase Auth
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
          if (user) {
            try {
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
                setLoading(false);
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
                setLoading(false);
              } else {
                console.error('User not found in any Tenant Company.');
                setUserInfo(null);
                setLoading(false);
              }
            } catch (error) {
              console.error('Error fetching user info:', error);
              setUserInfo(null);
              setLoading(false);
            }
          } else {
            // No user logged in
            localStorage.removeItem('userInfo');
            setUserInfo(null);
            setLoading(false);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error in fetchUserInfo:', error);
        localStorage.removeItem('userInfo');
        setUserInfo(null);
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const clearUserInfo = () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
  };

  return { userInfo, loading, clearUserInfo };
};
