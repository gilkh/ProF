
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Admin SDK robustly with multiple credential fallbacks
function initAdmin() {
  if (admin.apps.length) return;
  try {
    let credential: admin.credential.Credential;

    // 1) FIREBASE_SERVICE_ACCOUNT (JSON string) support
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (saJson) {
      const parsed = JSON.parse(saJson);
      credential = admin.credential.cert(parsed);
    } else if (
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      // 2) Explicit env vars for private key and client email
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\r?\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL as string;
      credential = admin.credential.cert({ projectId, privateKey, clientEmail });
    } else {
      // 3) Application default credentials (GOOGLE_APPLICATION_CREDENTIALS, gcloud ADC)
      credential = admin.credential.applicationDefault();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    admin.initializeApp({ credential, projectId });
  } catch (error) {
    // Log a clear message but do not throw, to avoid crashing the server during dev
    console.error('[firebase-admin] Initialization failed. Ensure credentials are configured.', error);
  }
}

initAdmin();

// Guard: if initialization still failed, avoid hard crash by lazily accessing services
const adminDb = (() => {
  try {
    return getFirestore();
  } catch (e) {
    console.error('[firebase-admin] Firestore unavailable:', e);
    // Re-attempt initialization once
    initAdmin();
    return getFirestore();
  }
})();

const adminAuth = (() => {
  try {
    return getAuth();
  } catch (e) {
    console.error('[firebase-admin] Auth unavailable:', e);
    initAdmin();
    return getAuth();
  }
})();

const adminMessaging = (() => {
  try {
    return getMessaging();
  } catch (e) {
    console.error('[firebase-admin] Messaging unavailable:', e);
    initAdmin();
    return getMessaging();
  }
})();

export { admin, adminDb, adminAuth, adminMessaging };
