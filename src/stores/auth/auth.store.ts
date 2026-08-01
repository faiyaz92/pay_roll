import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { EmployeeInfo, UserInfo } from '@/types/user';

interface AuthStoreState {
  firebaseUser: User | null;
  userInfo: UserInfo | null;
  employeeInfo: EmployeeInfo | null;
  user: UserInfo | null; // Alias for backward compatibility
  loading: boolean;
  setFirebaseUser: (firebaseUser: User | null) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setEmployeeInfo: (employeeInfo: EmployeeInfo | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

// Centralized auth store to keep Firebase state separate from UI components.
//
// `user` is a plain, explicitly-synced alias for `userInfo` — NOT a getter.
// Zustand's `set()` merges partial updates via Object.assign, which reads
// accessor (getter) properties and bakes the result in as a static value on
// the very first merge. A `get user() { return get().userInfo }` getter
// here would therefore freeze at whatever `userInfo` was during the FIRST
// ever `set()` call (typically `null`, from setFirebaseUser firing before
// login resolves) and never update again, even after a real login. Keeping
// `user` as a plain field that every setter re-syncs avoids that trap.
export const useAuthStore = create<AuthStoreState>((set) => ({
  firebaseUser: null,
  userInfo: null,
  employeeInfo: null,
  user: null,
  loading: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setUserInfo: (userInfo) => set({ userInfo, user: userInfo }),
  setEmployeeInfo: (employeeInfo) => set({ employeeInfo }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ firebaseUser: null, userInfo: null, user: null, employeeInfo: null, loading: true })
}));
