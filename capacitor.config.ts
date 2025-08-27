
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradecraft.app',
  appName: 'Farhetkoun',
  webDir: 'out',
  server: {
    // This is required for hot-reloading in local development
    // For production builds, it's not needed
    // url: 'http://192.168.1.10:3000', // Replace with your computer's local IP
    // cleartext: true
  },
};

export default config;
