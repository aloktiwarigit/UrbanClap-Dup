import { getCosmosClient, DB_NAME } from './client.js';
import { ErasureRequestDocSchema } from '../schemas/erasure-request.js';
import type { ErasureRequestDoc } from '../schemas/erasure-request.js';
import type { SqlQuerySpec, SqlParameter } from '@azure/cosmos';

const CONTAINER = 'erasure_requests';

function container() {
  return getCosmosClient().database(DB_NAME).container(CONTAINER);
}

export class DuplicatePendingError extends Error {
  constructor() { super('ERASURE_REQUEST_PENDING'); }
}

function isCosmosConflict(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'statusCode' in err &&
    (err as { statusCode: number }).statusCode === 409
  );
}

/**
 * Creates an erasure request. The caller MUST set doc.id = "pending:{userId}"
 * so Cosmos enforces one-at-a-time atomically. Throws DuplicatePendingError
 * on 409 Conflict (concurrent submit or active document already exists).
 */
export async function createErasureRequest(doc: ErasureRequestDoc): Promise<void> {
  try {
    await container().items.create(doc);
  } catch (err) {
    if (isCosmosConflict(err)) throw new DuplicatePendingError();
    throw err;
  }
}

export async function getErasureRequestById(
  id: string,
): Promise<{ doc: ErasureRequestDoc; etag: string } | null> {
  const response = await container().item(id, id).read<Record<string, unknown>>();
  if (response.resource === undefined) return null;
  return {
    doc: ErasureRequestDocSchema.parse(response.resource),
    etag: response.etag ?? '',
  };
}

/**
 * Returns the user's active erasure document (any status) with its etag.
 * Uses the deterministic "pending:{userId}" id for a single-partition point read.
 */
export async function getActiveErasureRequestForUser(
  userId: string,
): Promise<{ doc: ErasureRequestDoc; etag: string } | null> {
  return getErasureRequestById(`pending:${userId}`);
}

/** @deprecated use getActiveErasureRequestForUser */
export async function getPendingErasureRequestForUser(
  userId: string,
): Promise<ErasureRequestDoc | null> {
  const result = await getActiveErasureRequestForUser(userId);
  return result !== null && result.doc.status === 'PENDING' ? result.doc : null;
}

/** Used by cron timer: PENDING with scheduledDeletionAt <= now. */
export async function listOverduePendingErasureRequests(
  nowIso: string,
): Promise<ErasureRequestDoc[]> {
  const query: SqlQuerySpec = {
    query:
      'SELECT * FROM c WHERE c.status = @pending AND c.scheduledDeletionAt <= @now',
    parameters: [
      { name: '@pending', value: 'PENDING' },
      { name: '@now', value: nowIso },
    ],
  };
  const { resources } = await container().items
    .query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.map((r) => ErasureRequestDocSchema.parse(r));
}

/** Replace with optimistic concurrency. Caller passes etag from getErasureRequestById. */
export async function replaceErasureRequest(
  doc: ErasureRequestDoc,
  etag?: string,
): Promise<void> {
  const options = etag
    ? { accessCondition: { type: 'IfMatch' as const, condition: etag } }
    : {};
  await container().item(doc.id, doc.id).replace(doc, options);
}

export interface ErasureRequestListFilter {
  status?: ErasureRequestDoc['status'];
  pageSize?: number;
}

export async function listErasureRequests(
  filter: ErasureRequestListFilter = {},
): Promise<ErasureRequestDoc[]> {
  const conditions: string[] = [];
  const parameters: SqlParameter[] = [];
  if (filter.status !== undefined) {
    conditions.push('c.status = @status');
    parameters.push({ name: '@status', value: filter.status });
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query: SqlQuerySpec = {
    query: `SELECT * FROM c ${where} ORDER BY c.requestedAt DESC`,
    parameters,
  };
  const pageSize = filter.pageSize ?? 50;
  const iterator = container().items.query<Record<string, unknown>>(query, {
    maxItemCount: pageSize,
  });
  const page = await iterator.fetchNext();
  return page.resources.map((r) => ErasureRequestDocSchema.parse(r));
}
