/**
 * Secondary Firebase App — used solely to create new Firebase Auth accounts
 * (demo seeding, HR-created employees/HR users) without disturbing whoever
 * is currently signed in on the primary app instance.
 */

import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const SECONDARY_APP_NAME = 'secondary';

const getEnvVar = (key: string, fallback: string): string => {
  return (import.meta.env[key] as string) || fallback;
};

const firebaseConfig: FirebaseOptions = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'AIzaSyAY3TseN8w0IvVJIxpaYvLKnP3H1DmtFYg'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'requiementgathering.firebaseapp.com'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'requiementgathering'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'requiementgathering.firebasestorage.app'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '297040139948'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', '1:297040139948:web:4a339a1d3150e95a3c3109'),
};

const getSecondaryApp = () => {
  const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  return existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
};

/**
 * Creates a new Firebase Auth user (or, if the email is already registered,
 * signs in to recover its uid) on an isolated secondary Auth instance so the
 * caller's own session is never affected. Always signs the secondary
 * instance back out before returning.
 */
export const createAuthUser = async (
  email: string,
  password: string
): Promise<{ uid: string; alreadyExisted: boolean }> => {
  const secondaryAuth = getAuth(getSecondaryApp());

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return { uid, alreadyExisted: false };
  } catch (error: any) {
    if (error?.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(secondaryAuth, email, password);
      const uid = cred.user.uid;
      await signOut(secondaryAuth);
      return { uid, alreadyExisted: true };
    }
    await signOut(secondaryAuth).catch(() => {});
    throw error;
  }
};
