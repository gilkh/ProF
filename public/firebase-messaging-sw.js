// Minimal service worker for Firebase Cloud Messaging on the web
// This SW enables registration for push notifications and displays
// notifications when payloads contain a `notification` field.

/* eslint-disable no-restricted-globals */

// Generic handler for push events. This does not rely on firebase messaging
// SDK in the worker. It will work for standard FCM payloads that include
// the `notification` property.
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const notification = data.notification || {};
    const title = notification.title || data.title || 'New Notification';
    const options = {
      body: notification.body || data.body || '',
      icon: notification.icon || '/logo.png',
      badge: notification.badge || '/logo.png',
      data: data.data || {},
      // Actions can be added if needed
      // actions: [{ action: 'open', title: 'Open' }]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // If payload is not JSON, ignore
    console.warn('[SW] push event handling failed', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification?.data && event.notification.data.click_action) || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      const url = new URL(client.url);
      if (url.pathname === targetUrl && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  }));
});

// Optional: You can add background message handling using Firebase compat SDK.
// If needed later, uncomment the following and provide your Firebase config.
// self.importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
// self.importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');
// firebase.initializeApp({
//   apiKey: '...',
//   authDomain: '...',
//   projectId: '...',
//   storageBucket: '...',
//   messagingSenderId: '...',
//   appId: '...',
// });
// const messaging = firebase.messaging();
// messaging.onBackgroundMessage((payload) => {
//   const title = payload.notification?.title || 'New Message';
//   const options = {
//     body: payload.notification?.body || '',
//     icon: '/logo.png',
//   };
//   self.registration.showNotification(title, options);
// });