#!/usr/bin/env tsx
// Adds the composite index required for efficient cross-partition queries
// by technicianId on the bookings container.
//
// The bookings container is partitioned by /id (booking ID). Queries that
// filter on technicianId (a non-partition-key field) fan out across all
// physical partitions. Without a composite index the Cosmos Serverless
// query planner falls back to a full container scan, which is expensive
// and can exceed the free-tier RU burst limit (5,000 RU/s).
//
// After this script runs, Cosmos rebuilds the index in the background
// (typically completes within seconds for a pilot-scale container).
// No downtime or data loss occurs.
//
// Run once against production:
//   COSMOS_CONNECTION_STRING="AccountEndpoint=...;AccountKey=...;" \
//   COSMOS_DATABASE=homeservices \
//   npx tsx scripts/provision-cosmos-indexes.ts
//
// Or with separate endpoint + key:
//   COSMOS_ENDPOINT=https://... COSMOS_KEY=... COSMOS_DATABASE=homeservices \
//   npx tsx scripts/provision-cosmos-indexes.ts

import { CosmosClient, type ContainerDefinition, type IndexingPolicy } from '@azure/cosmos';

const DB_NAME = process.env.COSMOS_DATABASE ?? 'homeservices';

function getClient(): CosmosClient {
  const cs = process.env.COSMOS_CONNECTION_STRING;
  if (cs) {
    const endpointMatch = /AccountEndpoint=([^;]+)/i.exec(cs);
    const keyMatch = /AccountKey=([^;]+)/i.exec(cs);
    if (!endpointMatch || !keyMatch) throw new Error('Invalid COSMOS_CONNECTION_STRING');
    return new CosmosClient({ endpoint: endpointMatch[1]!, key: keyMatch[1]! });
  }
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  if (!endpoint || !key) throw new Error('Set COSMOS_CONNECTION_STRING or COSMOS_ENDPOINT+COSMOS_KEY');
  return new CosmosClient({ endpoint, key });
}

// Composite index that makes the getByTechnicianId query efficient.
// Covers: WHERE technicianId = ? AND status IN (...)
// and allows ORDER BY slotDate, slotWindow without an in-memory sort.
const TECHNICIAN_BOOKINGS_INDEX = [
  { path: '/technicianId', order: 'ascending' as const },
  { path: '/slotDate', order: 'ascending' as const },
  { path: '/slotWindow', order: 'ascending' as const },
];

function indexAlreadyPresent(
  compositeIndexes: Array<Array<{ path: string; order?: string }>> | undefined,
): boolean {
  if (!compositeIndexes) return false;
  return compositeIndexes.some(
    (idx) =>
      idx.length >= 2 &&
      idx[0]?.path === '/technicianId' &&
      idx[1]?.path === '/slotDate',
  );
}

async function main(): Promise<void> {
  const client = getClient();
  const container = client.database(DB_NAME).container('bookings');

  console.log(`Connecting to database "${DB_NAME}", container "bookings"…`);
  const { resource: def } = await container.read<ContainerDefinition>();
  if (!def) throw new Error('"bookings" container not found — check COSMOS_DATABASE');

  const existingPolicy = (def.indexingPolicy ?? {}) as IndexingPolicy;
  const existingComposite = existingPolicy.compositeIndexes ?? [];

  if (indexAlreadyPresent(existingComposite)) {
    console.log('✓ Composite index on [/technicianId, /slotDate, /slotWindow] already present. Nothing to do.');
    return;
  }

  const updatedPolicy: IndexingPolicy = {
    ...existingPolicy,
    compositeIndexes: [
      ...existingComposite,
      TECHNICIAN_BOOKINGS_INDEX,
    ],
  };

  console.log('Adding composite index [/technicianId asc, /slotDate asc, /slotWindow asc]…');
  await container.replace({ ...def, indexingPolicy: updatedPolicy });
  console.log('✓ Done. Cosmos is rebuilding the index in the background (usually <30 s for pilot scale).');
  console.log('  The GET /v1/technicians/me/bookings endpoint will return real data once the index is live.');
}

main().catch((err: unknown) => {
  console.error('provision-cosmos-indexes failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
