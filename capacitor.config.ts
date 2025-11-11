
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradecraft.app',
  appName: 'Farhetkoun',
  webDir: 'out',
  server: {
    url: 'https://farhetkoun.com',
    cleartext: false
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ["alert", "badge", "sound"],
    },
  },
};

export default config;
