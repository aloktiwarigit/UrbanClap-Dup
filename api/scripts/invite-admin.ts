#!/usr/bin/env tsx
// Creates or updates an invite-only admin_users record.
// The next verified Google sign-in for this email claims the invite and starts
// TOTP enrollment at /setup.
//
// Run:
//   COSMOS_CONNECTION_STRING=... pnpm invite:admin -- --email=owner@example.com

import { CosmosClient } from '@azure/cosmos';

const ROLES = ['super-admin', 'ops-manager', 'finance', 'support-agent'] as const;
type Role = (typeof ROLES)[number];

const emailArg = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1];
const roleArg = process.argv.find((a) => a.startsWith('--role='))?.split('=')[1] ?? 'super-admin';

function usage(): never {
  console.error('Usage: pnpm invite:admin -- --email=owner@example.com [--role=super-admin]');
  process.exit(1);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getCosmosClient(): CosmosClient {
  const connectionString = process.env.COSMOS_CONNECTION_STRING;
  if (connectionString) return new CosmosClient(connectionString);

  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  if (!endpoint || !key) {
    console.error('Set COSMOS_CONNECTION_STRING or both COSMOS_ENDPOINT and COSMOS_KEY.');
    process.exit(1);
  }
  return new CosmosClient({ endpoint, key });
}

async function main() {
  if (!emailArg) usage();
  if (!ROLES.includes(roleArg as Role)) {
    console.error(`Invalid role "${roleArg}". Expected one of: ${ROLES.join(', ')}`);
    process.exit(1);
  }

  const email = normalizeEmail(emailArg);
  const role = roleArg as Role;
  const inviteId = `invite:${email}`;
  const container = getCosmosClient()
    .database(process.env.COSMOS_DATABASE ?? 'homeservices')
    .container('admin_users');

  const { resources } = await container.items
    .query<{
      adminId: string;
      email: string;
      role: Role;
      totpEnrolled: boolean;
      createdAt?: string;
      deactivatedAt?: string | null;
    }>({
      query: 'SELECT c.adminId, c.email, c.role, c.totpEnrolled, c.createdAt, c.deactivatedAt FROM c WHERE c.email = @email OR c.adminId = @inviteId',
      parameters: [
        { name: '@email', value: email },
        { name: '@inviteId', value: inviteId },
      ],
    })
    .fetchAll();

  const existingAdmin = resources.find((u) => !u.adminId.startsWith('invite:'));
  if (existingAdmin) {
    console.log(
      `admin_users record already exists: ${existingAdmin.adminId} (${existingAdmin.role}, totpEnrolled=${existingAdmin.totpEnrolled})`,
    );
    return;
  }

  const existingInvite = resources.find((u) => u.adminId === inviteId);
  const now = new Date().toISOString();
  await container.items.upsert({
    id: inviteId,
    adminId: inviteId,
    email,
    role,
    totpEnrolled: false,
    totpSecret: null,
    totpSecretPending: null,
    createdAt: existingInvite?.createdAt ?? now,
    updatedAt: now,
    deactivatedAt: null,
  });

  console.log(existingInvite ? 'admin invite updated.' : 'admin invite created.');
  console.log(`email=${email}`);
  console.log(`role=${role}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
