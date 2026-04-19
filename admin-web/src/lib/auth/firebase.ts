import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
};

// Lazy factory — defers initializeApp() to first call so Next.js build
// (which evaluates modules without NEXT_PUBLIC_FIREBASE_* env vars) doesn't throw.
export function getFirebaseAuth() {
  const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  return getAuth(app);
}
