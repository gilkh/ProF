
'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from './firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function initializeNotifications(userId: string) {
  try {
    const messaging = getMessaging(app);

    // Request permission to receive notifications
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // Get the token
      const currentToken = await getToken(messaging, {
        vapidKey: 'BO2Tgi02oBTPlrFxYWDms6NVHEKqzy3Z7QtfCslG1GZda4hVpIu9eTx5C7tCrMwHqyY7NCFbw1LXr-d9P-GKctk', // IMPORTANT: Replace this
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Save the token to Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(currentToken),
        });
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Unable to get permission to notify.');
    }

    // Handle incoming messages while the app is in the foreground
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // You can display a custom notification or update the UI here
      const notificationTitle = payload.notification?.title || 'New Message';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/logo.png', // Optional: path to an icon
      };
      new Notification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.error('An error occurred while setting up notifications.', error);
  }
}
