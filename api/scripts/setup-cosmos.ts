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
  // DPDPA right-to-erasure: one document per request, partitioned by
  // /partitionKey (set to userId at submit time per schemas/erasure-request.ts).
  // The repo at api/src/cosmos/erasure-request-repository.ts queries this
  // container; if it does not exist, admin compliance page server-render
  // crashes with "Resource not found" → error.tsx "Something stalled".
  { id: 'erasure_requests',  partitionKey: '/partitionKey', ttl: undefined },
  // Admin-side customer metadata (flag, internal notes). One doc per customer
  // id, partitioned by /id so point reads in patchCustomerMetadata are O(1).
  // Missing this container makes the admin customers list silently empty
  // because the page wraps the fetch in try/catch (see app/[locale]/(dashboard)/
  // customers/page.tsx). Container name uses a hyphen per existing repo code
  // (api/src/cosmos/customer-metadata-repository.ts:3).
  { id: 'customer-metadata', partitionKey: '/id',           ttl: undefined },
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
  // E19-S02: Device tokens for FCM push (device-token-based sends, threat I-A2 mitigation).
  // Partitioned by /userId for single-partition reads per user.
  // No defaultTtl — manual prune via daily timer allows >60 day idle tokens if device used recently.
  { id: 'device_tokens', partitionKey: '/userId', ttl: undefined },
  // ── Out-of-band containers (existed on prod before this script tracked them) ──
  // Bookings — core transactional store. /id partition for point reads keyed by
  // bookingId; cross-partition for filter queries. Predates this script.
  { id: 'bookings', partitionKey: '/id', ttl: undefined },
  // Booking change-feed events for projectors; /bookingId for single-partition
  // ordered reads per booking.
  { id: 'booking_events', partitionKey: '/bookingId', ttl: undefined },
  // Dispatch attempts ledger — one doc per attempt, /id partition.
  { id: 'dispatch_attempts', partitionKey: '/id', ttl: undefined },
  // Ratings — one doc per booking, /bookingId partition so all ratings for a
  // booking sit in one partition (some bookings have customer + tech ratings).
  { id: 'ratings', partitionKey: '/bookingId', ttl: undefined },
  // Service catalogue: services partitioned by /categoryId for listing per
  // category in a single-partition query.
  { id: 'services', partitionKey: '/categoryId', ttl: undefined },
  // Service categories — top-level catalogue node. TTL=-1 = preserve forever.
  { id: 'service_categories', partitionKey: '/id', ttl: -1 },
  // Technicians directory — /id partition, point reads by technicianId.
  { id: 'technicians', partitionKey: '/id', ttl: undefined },
  // Wallet ledger — append-only credit/debit entries; /partitionKey field set
  // to customerId at write time so per-customer balance reads are single-partition.
  { id: 'wallet_ledger', partitionKey: '/partitionKey', ttl: undefined },
  // Razorpay webhook idempotency — /id is the webhook event id from Razorpay.
  { id: 'webhook_events', partitionKey: '/id', ttl: undefined },
  // ── Truly-missing containers (code references but never provisioned) ──
  // Finance: weekly payout snapshots — /partitionKey = weekStart (per
  // finance-repository.ts:181 upsert body). Missing → finance payout history
  // endpoint throws.
  { id: 'payout_snapshots', partitionKey: '/partitionKey', ttl: undefined },
  // Sliding-window token-bucket rate limiter — /id partition (key === id).
  // Missing → rate-limited endpoints fail unpredictably (the repo fails open
  // on Cosmos errors via Sentry warn, so this is degraded not blocking).
  { id: 'rate_limit_tokens', partitionKey: '/id', ttl: undefined },
  // Operational state cache (currently used by Truecaller public-key cache).
  // /id partition with a fixed doc id; missing → first request after cache TTL
  // throws inside truecaller.service.ts.
  { id: 'system', partitionKey: '/id', ttl: undefined },
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

  // Lease containers for change-feed projectors. All partitioned /id per Cosmos
  // change-feed library convention. createLeaseContainerIfNotExists=false in each
  // trigger, so these MUST be pre-provisioned (matches the api/CLAUDE.md Cosmos
  // Pre-Provisioning section).
  const leaseContainers = [
    'pending_actions_bookings_leases',
    'pending_actions_complaints_leases',
    'pending_actions_dispatch_leases',
    'pending_actions_kyc_leases',
    'pending_actions_ratings_leases',
    // ── Booking-event projectors (existed on prod before this script tracked them) ──
    'booking_completed_leases',
    'booking_rating_prompt_leases',
    'booking_report_leases',
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

  // E21-S01: Commission receivables — cash-pilot commission owed by technicians to platform.
  // One doc per completed cash booking (id = bookingId for idempotency).
  // Partitioned by /technicianId so per-tech outstanding reads are single-partition.
  // MUST be provisioned before the first COMPLETED booking fires the settlement trigger.
  await database.containers.createIfNotExists({
    id: 'commission_receivables',
    partitionKey: { paths: ['/technicianId'] },
  });
  console.log("Container 'commission_receivables' ready.");

  // E21-S01: Seed the global commission-config doc in the system container (if not already set).
  // defaultCommissionBps = 2200 matches the historical hardcoded default so P&L numbers don't jump.
  const systemContainer = database.container('system');
  try {
    await systemContainer.items.create({
      id: 'commission-config',
      defaultCommissionBps: 2200,
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
    });
    console.log("Seeded 'commission-config' doc in system container (defaultCommissionBps=2200).");
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 409) {
      console.log("'commission-config' doc already exists in system container — skipping seed.");
    } else {
      throw err;
    }
  }

  // E21-S02: Seed the technician-app remote-config doc (system container). Every feature flag
  // starts off — dark-launched until an admin explicitly turns one on. No admin PUT endpoint
  // exists yet for this doc (E21-S03 scope); until then it's edited directly via the Cosmos
  // data explorer for a controlled pilot rollout.
  try {
    await systemContainer.items.create({
      id: 'technician-client-config',
      features: { wallet: false, duesBanner: false, upiQr: false, incentives: false, addOnRequests: false },
      minSupportedVersionCode: 0,
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
    });
    console.log("Seeded 'technician-client-config' doc in system container (all features off).");
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 409) {
      console.log("'technician-client-config' doc already exists in system container — skipping seed.");
    } else {
      throw err;
    }
  }

  // E21-S02: Seed the hold-repair queue doc (system container) — starts empty. Populated by
  // best-effort recompute failures and the admin recompute-all endpoint; drained by the E21-S04
  // reconciler timer.
  try {
    await systemContainer.items.create({
      id: 'hold-repair',
      technicianIds: [],
      all: false,
      updatedAt: new Date().toISOString(),
    });
    console.log("Seeded 'hold-repair' doc in system container (empty queue).");
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 409) {
      console.log("'hold-repair' doc already exists in system container — skipping seed.");
    } else {
      throw err;
    }
  }

  // E21-S02: Add the hold-threshold/enforcement fields to the existing commission-config doc,
  // only where the key is currently absent — an admin who already customized
  // warnThresholdPaise before this script ran must not have it silently reset back to default.
  // Read-merge under an IfMatch condition so a concurrent admin PUT can't be clobbered.
  {
    const { resource: cfg, etag } = await systemContainer
      .item('commission-config', 'commission-config')
      .read<Record<string, unknown>>();

    if (cfg) {
      const additions: Record<string, unknown> = {};
      if (cfg['warnThresholdPaise'] === undefined) additions['warnThresholdPaise'] = 250_000;
      if (cfg['blockThresholdPaise'] === undefined) additions['blockThresholdPaise'] = 500_000;
      if (cfg['holdEnforcementEnabled'] === undefined) additions['holdEnforcementEnabled'] = false;
      if (cfg['enforceKycInDispatch'] === undefined) additions['enforceKycInDispatch'] = false;

      if (Object.keys(additions).length > 0) {
        await systemContainer
          .item('commission-config', 'commission-config')
          .replace(
            { ...cfg, ...additions },
            { accessCondition: { type: 'IfMatch', condition: etag ?? '' } },
          );
        console.log(`Added commission-config field(s) (only-if-absent): ${Object.keys(additions).join(', ')}.`);
      } else {
        console.log('commission-config already has every threshold/flag field — skipping merge.');
      }
    } else {
      console.log('commission-config doc not found — skipping threshold merge (seeded above on this same run).');
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
