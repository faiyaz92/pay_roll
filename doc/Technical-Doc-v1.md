# Payrole HR Management System - Technical Documentation

**Version:** 1.0  
**Date:** November 29, 2025  
**Author:** Payrole Development Team  
**Status:** Implementation Guide  

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [PWA Implementation](#2-pwa-implementation)
3. [Firebase Integration](#3-firebase-integration)
4. [Authentication System](#4-authentication-system)
5. [Dashboard Implementation](#5-dashboard-implementation)
6. [API Reference](#6-api-reference)
7. [Version History](#7-version-history)

## 1. System Architecture

**Related BRD:** BRD-v1.md Section 6  
**Related Checklist:** Checklist-v1.md Task 1.1

### 1.1 Technology Stack
```
Frontend Framework: React 18.2.0 + TypeScript
Build Tool: Vite 5.4.20
Styling: Tailwind CSS 3.4.0
State Management: React Context API
Routing: React Router 6.20.0
Backend: Firebase (Authentication + Firestore)
Deployment: Vercel
```

### 1.2 Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── ui/             # Base UI components (shadcn/ui)
│   └── PWAInstallButton.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components
│   ├── Login.tsx
│   └── Dashboard.tsx
├── types/              # TypeScript type definitions
└── config/             # Configuration files
    └── firebase.ts
```

### 1.3 Component Architecture
- **Container Components:** Handle data fetching and state
- **Presentational Components:** Pure UI components
- **Custom Hooks:** Business logic separation

## 2. PWA Implementation

**Related BRD:** BRD-v1.md Section 3.3  
**Related Checklist:** Checklist-v1.md Task 3.1-3.3

### 2.1 Service Worker
**File:** `public/sw.js`
```javascript
// Service worker for offline functionality
const CACHE_NAME = 'payrole-v1.0';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### 2.2 Web App Manifest
**File:** `public/manifest.json`
```json
{
  "name": "Payrole HR Management",
  "short_name": "Payrole",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    }
  ]
}
```

### 2.3 Installation Prompt
**Component:** `PWAInstallButton.tsx`
- Detects PWA installation capability
- Provides manual install button
- Handles beforeinstallprompt event

## 3. Firebase Integration

**Related BRD:** BRD-v1.md Section 4.2  
**Related Checklist:** Checklist-v1.md Task 1.2

### 3.1 Configuration
**File:** `src/config/firebase.ts`
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 3.2 Environment Variables
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 4. Authentication System

**Related BRD:** BRD-v1.md Section 3.1  
**Related Checklist:** Checklist-v1.md Task 1.1, 1.3

### 4.1 AuthContext Implementation
**File:** `src/contexts/AuthContext.tsx`
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'hr_manager' | 'employee';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}
```

### 4.2 Firebase Auth Integration
**Authentication Flow:**
1. User enters credentials
2. Firebase Auth.signInWithEmailAndPassword()
3. Retrieve user role from Firestore
4. Set user context
5. Redirect to dashboard

**Firestore User Document Structure:**
```json
{
  "users/{uid}": {
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "hr_manager",
    "createdAt": "2025-11-29T00:00:00Z",
    "lastLogin": "2025-11-29T00:00:00Z"
  }
}
```

### 4.3 Role-Based Access Control
```typescript
const rolePermissions = {
  admin: ['read', 'write', 'delete', 'manage_users'],
  hr_manager: ['read', 'write', 'view_reports'],
  employee: ['read', 'update_profile']
};
```

### 4.4 Login Component
**File:** `src/pages/Login.tsx`
- Form validation using react-hook-form
- Error handling for auth failures
- Loading states
- Remember me functionality

## 5. Dashboard Implementation

**Related BRD:** BRD-v1.md Section 3.2  
**Related Checklist:** Checklist-v1.md Task 2.1-2.2

### 5.1 Component Structure
**File:** `src/pages/Dashboard.tsx`
```typescript
const Dashboard: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-gray-900">
        Welcome to Payrole
      </h1>
    </div>
  );
};
```

### 5.2 Responsive Design
- Mobile-first approach using Tailwind CSS
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Flexbox and Grid layouts
- Touch-friendly interactions

### 5.3 Future Extensibility
The dashboard component is designed to be easily extensible:
- Modular card-based layout
- Hook-based data fetching
- Conditional rendering based on user roles

## 6. API Reference

### 6.1 Firebase Queries
**User Authentication:**
```typescript
// Login
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Get user data
const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

// Logout
await signOut(auth);
```

**Data Fetching Patterns:**
```typescript
// Using custom hook
const { data, loading, error } = useFirebaseData('collectionName');
```

## 7. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-29 | Initial implementation with auth and dashboard | Payrole Team |

---

**Next Version:** Technical-Doc-v2.md (Employee CRUD Operations)  
**Previous Version:** N/A (Initial Version)  
**Related BRD:** BRD-v1.md  
**Related Checklist:** Checklist-v1.md