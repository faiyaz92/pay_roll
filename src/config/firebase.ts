
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration - Updated with real credentials
const firebaseConfig = {
  apiKey: "AIzaSyAY3TseN8w0IvVJIxpaYvLKnP3H1DmtFYg",
  authDomain: "requiementgathering.firebaseapp.com",
  projectId: "requiementgathering",
  storageBucket: "requiementgathering.firebasestorage.app",
  messagingSenderId: "297040139948",
  appId: "1:297040139948:web:4a339a1d3150e95a3c3109",
  measurementId: "G-TB2KW7KLLB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the path structure from SRS
export const firestore = getFirestore(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firestore collection paths as specified in SRS - following your Flutter pattern
export const basePath = "Easy2Solutions/companyDirectory/tenantCompanies";
export const superAdminsPath = "Easy2Solutions/companyDirectory/superAdmins";
export const commonUsersPath = "Easy2Solutions/companyDirectory/users";

export default app;
