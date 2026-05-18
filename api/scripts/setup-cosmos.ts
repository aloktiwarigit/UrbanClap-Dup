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
  // E17-S02: live technician location — one doc per active booking, last-write-wins.
  // Cosmos auto-deletes after 1h (TTL=3600). Partitioned by /bookingId for single-partition reads.
  { id: 'live_locations', partitionKey: '/bookingId', ttl: 3600 },
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

  // E16-S02: Slot holds for conflict locking — partition by composite serviceId|date key.
  // Default TTL = 30 s (soft hold). commitHold sets TTL = -1 on the doc to make permanent.
  await database.containers.createIfNotExists({
    id: 'slot_holds',
    partitionKey: { paths: ['/servicePartitionKey'] },
    defaultTtl: 30,
  });
  console.log("Container 'slot_holds' ready.");

  // E16-S04/WS-F: Waitlist — customers who requested a service in their area.
  // Partitioned by /phone for per-customer access patterns.
  // TTL = 1 year (31 536 000 s) for compliance retention; admin CSV export deferred to E16-S04b.
  await database.containers.createIfNotExists({
    id: 'customer_waitlist',
    partitionKey: { paths: ['/phone'] },
    defaultTtl: 31_536_000,
  });
  console.log("Container 'customer_waitlist' ready.");

  // E11-S05b-2: Per-incident AES key docs for SOS audio encryption.
  // Partitioned by /customerId for single-partition key lookups in the playback endpoint.
  // defaultTtl = 604800 (7 days) ensures keys auto-delete with the Storage blob lifecycle.
  await database.containers.createIfNotExists({
    id: 'sos_incident_keys',
    partitionKey: { paths: ['/customerId'] },
    defaultTtl: 604800,
  });
  console.log("Container 'sos_incident_keys' ready.");
}

main().catch((e) => { console.error(e); process.exit(1); });
