
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

// Check if admin is already initialized to prevent re-initialization errors
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // In a real production environment, you would use service account credentials.
      // For this environment, we can rely on Application Default Credentials.
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

const adminDb = getFirestore();
const adminAuth = getAuth();
const adminMessaging = getMessaging();

export { admin, adminDb, adminAuth, adminMessaging };
