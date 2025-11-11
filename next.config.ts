
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
  async headers() {
    // Server-level CSP to allow Capacitor bridge scripts when loaded inside native WebView.
    // Temporarily permissive during diagnostics; can be tightened after native detection is confirmed.
    const csp = [
      "default-src 'self' https: http: data: blob: 'unsafe-inline' 'unsafe-eval' capacitor:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: blob: capacitor:",
      "style-src 'self' 'unsafe-inline' https: http: capacitor:",
      "img-src 'self' https: http: data: blob: capacitor:",
      "connect-src * ws: wss: https: http: capacitor:",
      "font-src 'self' https: http: data: capacitor:",
      "media-src 'self' https: http: data: blob: capacitor:"
    ].join('; ');
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Firebase Admin SDK from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        http2: false,
        stream: false,
        url: false,
        zlib: false,
        https: false,
        http: false,
      };
      
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'firebase-admin',
        'firebase-admin/auth': 'firebase-admin/auth',
        'firebase-admin/firestore': 'firebase-admin/firestore',
        'firebase-admin/messaging': 'firebase-admin/messaging',
      });
    }
    return config;
  },
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
