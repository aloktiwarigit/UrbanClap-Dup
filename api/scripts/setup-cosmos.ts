#!/usr/bin/env tsx
// Creates the homeservices database and required containers if they don't exist.
// Run: npx tsx scripts/setup-cosmos.ts

import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!,
});

const DB = 'homeservices';

const containers = [
  { id: 'admin_users',    partitionKey: '/adminId',      ttl: undefined },
  { id: 'admin_sessions', partitionKey: '/sessionId',    ttl: 28800 },
  { id: 'audit_log',      partitionKey: '/partitionKey', ttl: undefined },
  { id: 'health',         partitionKey: '/id',           ttl: undefined },
  { id: 'complaints',     partitionKey: '/id',           ttl: undefined },
] as const;

async function main() {
  const { database } = await client.databases.createIfNotExists({ id: DB });
  console.log(`Database '${DB}' ready.`);

  for (const c of containers) {
    await database.containers.createIfNotExists({
      id: c.id,
      partitionKey: { paths: [c.partitionKey] },
      ...(c.ttl ? { defaultTtl: c.ttl } : {}),
    });
    console.log(`Container '${c.id}' ready.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
