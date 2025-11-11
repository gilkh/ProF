
'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db, auth } from './firebase';
import { doc, updateDoc, arrayUnion, setDoc, serverTimestamp } from 'firebase/firestore';

declare global {
  interface Window {
    Capacitor?: any;
  }
}

/**
 * Initialize notifications across Web and Capacitor (Android/iOS).
 * Web uses FCM Web SDK with a VAPID key via service worker.
 * Native apps use Capacitor plugin bridges when available (FirebaseMessaging preferred).
 */
export async function initializeNotifications(userId: string) {
  try {
    const isNative = Boolean(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform);

    if (isNative) {
      await initializeNativePush(userId);
      return;
    }

    await initializeWebPush(userId);
  } catch (error) {
    console.warn('An error occurred while setting up notifications.', error);
  }
}

async function initializeWebPush(userId: string) {
  const messaging = getMessaging(app);

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Web push: permission not granted.');
    return;
  }

  let swReg: ServiceWorkerRegistration | undefined;
  if ('serviceWorker' in navigator) {
    try {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      console.log('[notifications] Service worker registered:', swReg.scope);
    } catch (swErr) {
      console.warn('[notifications] Failed to register service worker; continuing.', swErr);
    }
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('[notifications] Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY. Web push token will not be generated.');
    return;
  }

  try {
    const currentToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });

    if (currentToken) {
      console.log('Web FCM token:', currentToken);
      const userRef = doc(db, 'users', userId);
      try {
        await updateDoc(userRef, { fcmTokens: arrayUnion(currentToken) });
      } catch (e) {
        // Fallback: create a minimal user profile so tokens can be stored
        const currentUser = auth.currentUser;
        const email = currentUser?.email || '';
        const emailVerified = !!currentUser?.emailVerified;
        const provider = currentUser?.providerData?.[0]?.providerId || 'password';
        await setDoc(
          userRef,
          {
            // Minimal fields required by security rules for create
            email,
            status: 'active',
            emailVerified,
            provider,
            createdAt: serverTimestamp(),
            // Append token
            fcmTokens: arrayUnion(currentToken),
          },
          { merge: true }
        );
      }
    } else {
      console.log('Web push: no registration token available.');
    }
  } catch (tokenErr) {
    console.warn('[notifications] Failed to obtain web FCM token. Verify VAPID key and push configuration.', tokenErr);
  }

  onMessage(messaging, (payload) => {
    console.log('Web push message received:', payload);
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/logo.png',
    } as const;
    try {
      new Notification(notificationTitle, notificationOptions);
    } catch {}
  });
}

async function initializeNativePush(userId: string) {
  const Plugins = window.Capacitor?.Plugins || {};
  const FirebaseMessaging = Plugins.FirebaseMessaging;
  const PushNotifications = Plugins.PushNotifications;

  // Prefer FirebaseMessaging to obtain FCM token on both Android and iOS
  if (FirebaseMessaging) {
    try {
      const perm = await FirebaseMessaging.requestPermissions();
      if (perm.receive === 'granted' || perm.receive === true) {
        const { token } = await FirebaseMessaging.getToken();
        if (token) {
          console.log('Native FCM token:', token);
          const userRef = doc(db, 'users', userId);
          try {
            await updateDoc(userRef, { fcmTokens: arrayUnion(token) });
          } catch (e) {
            const currentUser = auth.currentUser;
            const email = currentUser?.email || '';
            const emailVerified = !!currentUser?.emailVerified;
            const provider = currentUser?.providerData?.[0]?.providerId || 'password';
            await setDoc(
              userRef,
              {
                email,
                status: 'active',
                emailVerified,
                provider,
                createdAt: serverTimestamp(),
                fcmTokens: arrayUnion(token),
              },
              { merge: true }
            );
          }
        }

        // Optional foreground listener
        FirebaseMessaging.addListener('messageReceived', (payload: any) => {
          console.log('Native push message received:', payload);
        });
      } else {
        console.log('Native push: permission not granted.');
      }
      return;
    } catch (err) {
      console.warn('[notifications] FirebaseMessaging bridge failed; falling back to PushNotifications.', err);
    }
  }

  // Fallback: use generic PushNotifications plugin (Android FCM, iOS APNs token)
  if (PushNotifications) {
    try {
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive === 'granted' || perm.receive === true) {
        await PushNotifications.register();
        PushNotifications.addListener('registration', async (token: { value: string }) => {
          console.log('Native registration token:', token?.value);
          const userRef = doc(db, 'users', userId);
          try {
            await updateDoc(userRef, { fcmTokens: arrayUnion(token.value) });
          } catch (e) {
            const currentUser = auth.currentUser;
            const email = currentUser?.email || '';
            const emailVerified = !!currentUser?.emailVerified;
            const provider = currentUser?.providerData?.[0]?.providerId || 'password';
            await setDoc(
              userRef,
              {
                email,
                status: 'active',
                emailVerified,
                provider,
                createdAt: serverTimestamp(),
                fcmTokens: arrayUnion(token.value),
              },
              { merge: true }
            );
          }
        });
        PushNotifications.addListener('registrationError', (err: any) => {
          console.warn('Native registration error:', err);
        });
        PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
          console.log('Native notification received:', notification);
        });
      } else {
        console.log('Native push: permission not granted.');
      }
    } catch (err) {
      console.warn('[notifications] PushNotifications bridge unavailable.', err);
    }
  } else {
    console.warn('[notifications] No Capacitor push plugins found. Install @capacitor-firebase/messaging for FCM tokens.');
  }
}
