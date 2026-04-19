#!/usr/bin/env tsx
// Creates the Firebase user + admin_users Cosmos record for the first super-admin.
// TOTP enrollment happens on first login at /setup.
// Run:
//   FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY=... \
//   COSMOS_ENDPOINT=... COSMOS_KEY=... \
//   npx tsx scripts/seed-admin.ts --email=owner@example.com --password=StrongPass1!

import admin from 'firebase-admin';
import { CosmosClient } from '@azure/cosmos';

const email = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1];
const password = process.argv.find((a) => a.startsWith('--password='))?.split('=')[1];

if (!email || !password) {
  console.error('Usage: npx tsx scripts/seed-admin.ts --email=... --password=...');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});

const cosmos = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!,
});

async function main() {
  let uid: string;
  try {
    const user = await admin.auth().createUser({ email, password });
    uid = user.uid;
    console.log(`Firebase user created: ${uid}`);
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      const user = await admin.auth().getUserByEmail(email!);
      uid = user.uid;
      console.log(`Firebase user already exists: ${uid}`);
    } else {
      throw err;
    }
  }

  const container = cosmos.database('homeservices').container('admin_users');
  try {
    await container.items.create({
      id: uid, adminId: uid, email, role: 'super-admin',
      totpEnrolled: false, totpSecret: null, totpSecretPending: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      deactivatedAt: null,
    });
    console.log('admin_users record created.');
  } catch (err: any) {
    if (err.code === 409) {
      console.log('admin_users record already exists.');
    } else {
      throw err;
    }
  }

  console.log('\nDone. First login at /login will redirect to /setup for TOTP enrollment.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
