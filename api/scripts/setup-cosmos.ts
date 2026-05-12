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
  // NOTE (P1-1): this container is partitioned by /id, NOT /customerId.
  // Balance queries must use cross-partition execution (see customer-credit-ledger-repository.ts).
  // TODO: future migration to partition by /customerId for single-partition balance queries.
  { id: 'customer_credits',  partitionKey: '/id',           ttl: undefined },
  // E13-S01 (P2-7): applied-credit idempotency dedup — 24h TTL per idempotency-key.
  // Partitioned by /customerId so reads by (idempotencyKey, customerId) are single-partition.
  // Container name: applied_credit_idempotency
  { id: 'applied_credit_idempotency', partitionKey: '/customerId', ttl: 86400 },
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

  // ── E11-S02: pending_actions + 5 new lease containers ────────────────────────
  // The pending_actions container stores projected actions for customer + technician apps.
  await database.containers.createIfNotExists({
    id: 'pending_actions',
    partitionKey: { paths: ['/userId'] },
    // Composite index to support priority + expiresAt sort without cross-partition scans
    indexingPolicy: {
      indexingMode: 'consistent',
      includedPaths: [{ path: '/*' }],
      compositeIndexes: [
        [
          { path: '/userId', order: 'ascending' },
          { path: '/status', order: 'ascending' },
          { path: '/priority', order: 'ascending' },
          { path: '/expiresAt', order: 'ascending' },
        ],
      ],
    },
  });
  console.log(`Container 'pending_actions' ready.`);

  // Lease containers for 5 change-feed projectors.
  // Convention matches existing leases: booking_completed_leases, booking_rating_prompt_leases,
  // booking_report_leases — all partitioned /id.
  // createLeaseContainerIfNotExists=false in each trigger, so these MUST be pre-provisioned.
  const leaseContainers = [
    'pending_actions_bookings_leases',
    'pending_actions_complaints_leases',
    'pending_actions_dispatch_leases',
    'pending_actions_kyc_leases',
    'pending_actions_ratings_leases',
  ];
  for (const leaseId of leaseContainers) {
    await database.containers.createIfNotExists({
      id: leaseId,
      partitionKey: { paths: ['/id'] },
    });
    console.log(`Container '${leaseId}' ready.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
