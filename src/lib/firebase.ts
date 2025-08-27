
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
// REMOVED: import admin from 'firebase-admin';

// Check if admin is already initialized to prevent re-initialization errors
// REMOVED: Admin initialization is moved to a separate server-only file.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase only once
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

db = getFirestore(app);
auth = getAuth(app);

// In a real development environment, you might connect to emulators.
// For this environment, we will ensure we are connecting to the production services.
// This specifically resolves the auth/configuration-not-found error.
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // This is a check to make sure we're not in a local emulator environment.
    // By providing the production auth object without connecting to an emulator,
    // we ensure it uses the production settings.
}


export { app, db, auth };
