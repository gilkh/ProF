
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'export',
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyCRM1IeOKLecBUl10L4XNPU9lWjuf2_TyA',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'tradecraft-5c8mv.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'tradecraft-5c8mv',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'tradecraft-5c8mv.firebasestorage.app',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '864853702730',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:864853702730:web:e03190ceafd4278dfd8eb3',
  },
};

export default nextConfig;
