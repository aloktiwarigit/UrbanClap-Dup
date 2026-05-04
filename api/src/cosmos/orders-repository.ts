import type { CosmosClient, SqlParameter } from '@azure/cosmos';
import { getCosmosClient, DB_NAME } from './client.js';
import { OrderSchema, type Order, type OrderListQuery, type OrderListResponse } from '../schemas/order.js';

function getContainer(client: CosmosClient) {
  return client.database(DB_NAME).container('bookings');
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function scheduledAtFromSlot(slotDate: string | undefined, slotWindow: string | undefined): string | undefined {
  if (!slotDate) return undefined;
  const slotStart = slotWindow?.split('-')[0] ?? '00:00';
  return `${slotDate}T${slotStart}:00+05:30`;
}

function cityFromBooking(resource: Record<string, unknown>): string {
  const city = asString(resource['city']);
  if (city) return city;

  const address = asString(resource['addressText']);
  const inferred = address
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);

  return inferred ?? 'Unspecified';
}

function toAdminOrder(resource: unknown): Order {
  const raw = resource as Record<string, unknown>;
  const customerId = asString(raw['customerId']) ?? 'unknown-customer';
  const scheduledAt = asString(raw['scheduledAt'])
    ?? scheduledAtFromSlot(asString(raw['slotDate']), asString(raw['slotWindow']))
    ?? asString(raw['createdAt'])
    ?? new Date(0).toISOString();

  return OrderSchema.parse({
    ...raw,
    id: asString(raw['id']) ?? '',
    customerId,
    customerName: asString(raw['customerName']) ?? `Customer ${customerId.slice(0, 8)}`,
    customerPhone: asString(raw['customerPhone']) ?? '',
    serviceId: asString(raw['serviceId']),
    serviceName: asString(raw['serviceName']),
    technicianId: asString(raw['technicianId']),
    technicianName: asString(raw['technicianName']),
    status: raw['status'],
    city: cityFromBooking(raw),
    scheduledAt,
    amount: asNumber(raw['finalAmount']) ?? asNumber(raw['amount']) ?? 0,
    createdAt: asString(raw['createdAt']) ?? scheduledAt,
    _ts: asNumber(raw['_ts']),
  });
}

function endOfDateFilter(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;
}

function buildWhereClause(filters: OrderListQuery): { where: string; params: SqlParameter[] } {
  const conditions: string[] = [];
  const params: SqlParameter[] = [];

  if (filters.status?.length) {
    const placeholders = filters.status.map((_, i) => `@status${i}`).join(', ');
    conditions.push(`c.status IN (${placeholders})`);
    filters.status.forEach((s, i) => params.push({ name: `@status${i}`, value: s }));
  }
  if (filters.city) {
    conditions.push('(c.city = @city OR (IS_DEFINED(c.addressText) AND CONTAINS(LOWER(c.addressText), LOWER(@city))))');
    params.push({ name: '@city', value: filters.city });
  }
  if (filters.categoryId) {
    conditions.push('c.categoryId = @categoryId');
    params.push({ name: '@categoryId', value: filters.categoryId });
  }
  if (filters.technicianId) {
    conditions.push('c.technicianId = @technicianId');
    params.push({ name: '@technicianId', value: filters.technicianId });
  }
  if (filters.customerPhone) {
    conditions.push('c.customerPhone = @customerPhone');
    params.push({ name: '@customerPhone', value: filters.customerPhone });
  }
  if (filters.dateFrom) {
    conditions.push('((IS_DEFINED(c.scheduledAt) AND c.scheduledAt >= @dateFrom) OR (NOT IS_DEFINED(c.scheduledAt) AND c.slotDate >= @dateFromDate))');
    params.push({ name: '@dateFrom', value: filters.dateFrom });
    params.push({ name: '@dateFromDate', value: filters.dateFrom.slice(0, 10) });
  }
  if (filters.dateTo) {
    conditions.push('((IS_DEFINED(c.scheduledAt) AND c.scheduledAt <= @dateTo) OR (NOT IS_DEFINED(c.scheduledAt) AND c.slotDate <= @dateToDate))');
    params.push({ name: '@dateTo', value: endOfDateFilter(filters.dateTo) });
    params.push({ name: '@dateToDate', value: filters.dateTo.slice(0, 10) });
  }
  if (filters.minAmount !== undefined) {
    conditions.push('c.amount >= @minAmount');
    params.push({ name: '@minAmount', value: filters.minAmount });
  }
  if (filters.maxAmount !== undefined) {
    conditions.push('c.amount <= @maxAmount');
    params.push({ name: '@maxAmount', value: filters.maxAmount });
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

export async function queryOrders(filters: OrderListQuery): Promise<OrderListResponse> {
  const client = getCosmosClient();
  const container = getContainer(client);
  const { where, params } = buildWhereClause(filters);
  const offset = (filters.page - 1) * filters.pageSize;

  const countQuery = {
    query: `SELECT VALUE COUNT(1) FROM c ${where}`,
    parameters: params,
  };
  const { resources: countResult } = await container.items.query(countQuery).fetchAll();
  const total: number = (countResult[0] as number) ?? 0;

  const dataQuery = {
    query: `SELECT * FROM c ${where} ORDER BY c.createdAt DESC OFFSET ${offset} LIMIT ${filters.pageSize}`,
    parameters: params,
  };
  const { resources } = await container.items.query(dataQuery).fetchAll();
  const items: Order[] = resources.map(toAdminOrder);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const client = getCosmosClient();
  const container = getContainer(client);
  const { resources } = await container.items.query({
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: id }],
  }).fetchAll();
  if (!resources.length) return null;
  return toAdminOrder(resources[0]);
}
