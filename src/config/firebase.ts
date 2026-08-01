
import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

type FirebaseEnvKey =
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_FIREBASE_APP_ID';

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
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || 'G-TB2KW7KLLB'
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseApp = app;
export const firestore = getFirestore(app);
export const db = firestore;
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION);

export default app;
