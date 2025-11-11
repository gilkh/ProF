
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradecraft.app',
  appName: 'Farhetkoun',
  webDir: 'out',
  server: {
    url: 'https://farhetkoun.com',
    cleartext: false,
    allowNavigation: ['farhetkoun.com', 'www.farhetkoun.com']
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ["alert", "badge", "sound"],
    },
  },
};

export default config;
