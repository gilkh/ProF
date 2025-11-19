

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradecraft.app',
  appName: 'Farhetkoun',
  webDir: 'out',
  server: {
    url: 'https://www.farhetkoun.com',
    cleartext: false,
    // Broaden temporarily to ensure all navigations stay in-app WebView
    // This helps diagnose cases where links escape to external browser.
    allowNavigation: ['*'],
    androidScheme: 'https',
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ["alert", "badge", "sound"],
    },
  },
  android: {
    // Enable persistent cookies and storage
    webContentsDebuggingEnabled: false,
    allowMixedContent: true,
  }
};

export default config;

