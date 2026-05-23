import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

let _app: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (!_app) {
    const existingApp = admin.apps[0];
    if (existingApp) {
      _app = existingApp;
      return _app;
    }
    const projectId = process.env.FIREBASE_PROJECT_ID!;
    _app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`,
    });
  }
  return _app;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  return getFirebaseAdmin().auth().verifyIdToken(idToken);
}
