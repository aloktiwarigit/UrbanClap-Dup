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
  { id: 'admin_users',       partitionKey: '/adminId',      ttl: undefined },
  { id: 'admin_sessions',    partitionKey: '/sessionId',    ttl: 28800 },
  { id: 'audit_log',         partitionKey: '/partitionKey', ttl: undefined },
  { id: 'health',            partitionKey: '/id',           ttl: undefined },
  { id: 'ssc_levies',        partitionKey: '/quarter',      ttl: undefined },
  // E07-S04: customer credit wallet for no-show compensation — partitioned by /id
  // (one document per bookingId, idempotency-safe via conflict on duplicate /id)
  { id: 'customer_credits',  partitionKey: '/id',           ttl: undefined },
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

  // Complaints container needs a custom indexing policy to exclude note bodies
  // (reduces RU/write cost at scale) — must match src/cosmos/seeds/complaints.ts.
  await database.containers.createIfNotExists({
    id: 'complaints',
    partitionKey: { paths: ['/id'] },
    defaultTtl: -1,
    indexingPolicy: {
      indexingMode: 'consistent',
      includedPaths: [{ path: '/*' }],
      excludedPaths: [{ path: '/internalNotes/*' }],
    },
  });
  console.log(`Container 'complaints' ready.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
