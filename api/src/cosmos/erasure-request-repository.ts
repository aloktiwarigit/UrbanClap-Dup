import { getCosmosClient, DB_NAME } from './client.js';
import { ErasureRequestDocSchema } from '../schemas/erasure-request.js';
import type { ErasureRequestDoc } from '../schemas/erasure-request.js';
import type { SqlQuerySpec, SqlParameter } from '@azure/cosmos';

const CONTAINER = 'erasure_requests';

function container() {
  return getCosmosClient().database(DB_NAME).container(CONTAINER);
}

export async function createErasureRequest(doc: ErasureRequestDoc): Promise<void> {
  await container().items.create(doc);
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

/** Used by user-facing submit to enforce one PENDING request per user (409). */
export async function getPendingErasureRequestForUser(
  userId: string,
): Promise<ErasureRequestDoc | null> {
  const query: SqlQuerySpec = {
    query: 'SELECT TOP 1 * FROM c WHERE c.userId = @userId AND c.status = @pending',
    parameters: [
      { name: '@userId', value: userId },
      { name: '@pending', value: 'PENDING' },
    ],
  };
  const { resources } = await container().items
    .query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.length > 0 ? ErasureRequestDocSchema.parse(resources[0]) : null;
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
