// frontend/capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.snackstrack',
  appName: 'SnacksTrack',
  webDir: 'dist',
  server: {
    url: 'https://blue-rock-0ae0f3d03.2.azurestaticapps.net', // <-- your SWA
    cleartext: false
  }
};

export default config;
