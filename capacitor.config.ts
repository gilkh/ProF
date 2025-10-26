
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradecraft.app',
  appName: 'Farhetkoun',
  webDir: 'out',
  server: {
    url: 'https://pro-f-ecru.vercel.app',
    cleartext: false
  },
};

export default config;
