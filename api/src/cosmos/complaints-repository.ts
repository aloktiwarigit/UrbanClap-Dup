import { getCosmosClient, DB_NAME } from './client.js';
import { ComplaintDocSchema, ComplaintListResponseSchema } from '../schemas/complaint.js';
import type { ComplaintDoc, ComplaintListQuery, ComplaintListResponse } from '../schemas/complaint.js';
import type { SqlParameter, SqlQuerySpec } from '@azure/cosmos';

const CONTAINER = 'complaints';

export async function createComplaint(doc: ComplaintDoc): Promise<void> {
  await getCosmosClient().database(DB_NAME).container(CONTAINER).items.create(doc);
}

export async function getComplaint(id: string): Promise<{ doc: ComplaintDoc; etag: string } | null> {
  const response = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .item(id, id)
    .read<Record<string, unknown>>();
  if (response.resource === undefined) return null;
  return { doc: ComplaintDocSchema.parse(response.resource), etag: response.etag ?? '' };
}

export async function replaceComplaint(doc: ComplaintDoc, etag?: string): Promise<void> {
  const options = etag ? { accessCondition: { type: 'IfMatch' as const, condition: etag } } : {};
  await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .item(doc.id, doc.id)
    .replace(doc, options);
}

export async function queryComplaints(params: ComplaintListQuery): Promise<ComplaintListResponse> {
  const conditions: string[] = [];
  const parameters: SqlParameter[] = [];

  if (params.status !== undefined && params.status.length > 0) {
    const placeholders = params.status.map((_, i) => `@status${i}`).join(', ');
    conditions.push(`c.status IN (${placeholders})`);
    params.status.forEach((s, i) => {
      parameters.push({ name: `@status${i}`, value: s });
    });
  }
  if (params.assigneeAdminId !== undefined) {
    conditions.push('c.assigneeAdminId = @assigneeAdminId');
    parameters.push({ name: '@assigneeAdminId', value: params.assigneeAdminId });
  }
  if (params.dateFrom !== undefined) {
    conditions.push('c.createdAt >= @dateFrom');
    parameters.push({ name: '@dateFrom', value: params.dateFrom });
  }
  if (params.dateTo !== undefined) {
    conditions.push('c.createdAt <= @dateTo');
    parameters.push({ name: '@dateTo', value: params.dateTo });
  }
  if (params.resolvedSince !== undefined) {
    // Include items without resolvedAt (active complaints) alongside recently-resolved ones.
    conditions.push('(NOT IS_DEFINED(c.resolvedAt) OR c.resolvedAt >= @resolvedSince)');
    parameters.push({ name: '@resolvedSince', value: params.resolvedSince });
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.pageSize;

  const countQuery: SqlQuerySpec = {
    query: `SELECT VALUE COUNT(1) FROM c ${where}`,
    parameters,
  };

  const dir = (params.sortDir ?? 'desc').toUpperCase();
  const resolvedOnly = params.status?.length === 1 && params.status[0] === 'RESOLVED';
  // resolved-only: sort by resolvedAt so newest resolutions come first.
  // mixed/all with resolvedSince: sort by updatedAt so recently resolved old complaints
  //   surface near the top rather than being buried by old active items.
  // everything else: sort by createdAt.
  const orderBy = resolvedOnly && params.resolvedSince !== undefined
    ? `c.resolvedAt ${dir}`
    : params.resolvedSince !== undefined
      ? `c.updatedAt ${dir}`
      : `c.createdAt ${dir}`;
  const dataQuery: SqlQuerySpec = {
    query: `SELECT * FROM c ${where} ORDER BY ${orderBy} OFFSET ${offset} LIMIT ${params.pageSize}`,
    parameters,
  };

  const [countResult, dataResult] = await Promise.all([
    getCosmosClient()
      .database(DB_NAME)
      .container(CONTAINER)
      .items.query<number>(countQuery)
      .fetchAll(),
    getCosmosClient()
      .database(DB_NAME)
      .container(CONTAINER)
      .items.query<Record<string, unknown>>(dataQuery)
      .fetchAll(),
  ]);

  const total = countResult.resources[0] ?? 0;
  const items = dataResult.resources.map(r => ComplaintDocSchema.parse(r));

  return ComplaintListResponseSchema.parse({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  });
}

export async function getOverdueComplaints(): Promise<Array<{ doc: ComplaintDoc; etag: string }>> {
  const now = new Date().toISOString();
  const query: SqlQuerySpec = {
    query: `SELECT * FROM c WHERE c.slaDeadlineAt < @now AND c.status != @resolved AND (c.escalated != true OR NOT IS_DEFINED(c.escalated))`,
    parameters: [
      { name: '@now', value: now },
      { name: '@resolved', value: 'RESOLVED' },
    ],
  };
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.map(r => ({
    doc: ComplaintDocSchema.parse(r),
    etag: typeof r['_etag'] === 'string' ? r['_etag'] : '',
  }));
}

export async function getRepeatOffenders(
  sinceIso: string,
): Promise<Array<{ technicianId: string; count: number }>> {
  // Full scan bounded by sinceIso; revisit partition key strategy when container > pilot scale
  const query: SqlQuerySpec = {
    query: `SELECT * FROM c WHERE c.status = @resolved AND c.resolvedAt >= @since`,
    parameters: [
      { name: '@resolved', value: 'RESOLVED' },
      { name: '@since', value: sinceIso },
    ],
  };
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(query)
    .fetchAll();

  const counts = new Map<string, number>();
  for (const r of resources) {
    const doc = ComplaintDocSchema.parse(r);
    counts.set(doc.technicianId, (counts.get(doc.technicianId) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= 3)
    .map(([technicianId, count]) => ({ technicianId, count }));
}

export async function findActiveComplaintByBookingAndParty(
  bookingId: string,
  uid: string,
  filedBy: 'CUSTOMER' | 'TECHNICIAN',
): Promise<ComplaintDoc | null> {
  const query: SqlQuerySpec = {
    query: `SELECT TOP 1 * FROM c WHERE c.orderId = @bookingId
            AND c.filedBy = @filedBy
            AND (c.customerId = @uid OR c.technicianId = @uid)
            AND c.status != @resolved
            ORDER BY c.createdAt DESC`,
    parameters: [
      { name: '@bookingId', value: bookingId },
      { name: '@uid', value: uid },
      { name: '@filedBy', value: filedBy },
      { name: '@resolved', value: 'RESOLVED' },
    ],
  };
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.length > 0 ? ComplaintDocSchema.parse(resources[0]) : null;
}

export async function queryComplaintsByBookingAndParty(
  bookingId: string,
  uid: string,
  filedBy: 'CUSTOMER' | 'TECHNICIAN',
): Promise<ComplaintDoc[]> {
  const query: SqlQuerySpec = {
    query: `SELECT * FROM c WHERE c.orderId = @bookingId
            AND c.filedBy = @filedBy
            AND (c.customerId = @uid OR c.technicianId = @uid)
            ORDER BY c.createdAt DESC`,
    parameters: [
      { name: '@bookingId', value: bookingId },
      { name: '@uid', value: uid },
      { name: '@filedBy', value: filedBy },
    ],
  };
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.map(r => ComplaintDocSchema.parse(r));
}

export async function getUnacknowledgedPastDueComplaints(): Promise<Array<{ doc: ComplaintDoc; etag: string }>> {
  const now = new Date().toISOString();
  const query: SqlQuerySpec = {
    query: `SELECT * FROM c WHERE IS_DEFINED(c.acknowledgeDeadlineAt)
            AND c.acknowledgeDeadlineAt < @now
            AND c.status = @new
            AND (c.escalated != true OR NOT IS_DEFINED(c.escalated))
            AND (c.ackBreached != true OR NOT IS_DEFINED(c.ackBreached))`,
    parameters: [
      { name: '@now', value: now },
      { name: '@new', value: 'NEW' },
    ],
  };
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.map(r => ({
    doc: ComplaintDocSchema.parse(r),
    etag: typeof r['_etag'] === 'string' ? r['_etag'] : '',
  }));
}
