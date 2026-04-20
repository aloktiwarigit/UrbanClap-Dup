import type { CosmosClient, SqlParameter } from '@azure/cosmos';
import { getCosmosClient, DB_NAME } from './client.js';
import { OrderSchema, type Order, type OrderListQuery, type OrderListResponse } from '../schemas/order.js';

function getContainer(client: CosmosClient) {
  return client.database(DB_NAME).container('bookings');
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
    conditions.push('c.city = @city');
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
    conditions.push('c.scheduledAt >= @dateFrom');
    params.push({ name: '@dateFrom', value: filters.dateFrom });
  }
  if (filters.dateTo) {
    conditions.push('c.scheduledAt <= @dateTo');
    params.push({ name: '@dateTo', value: filters.dateTo });
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
  const items: Order[] = resources.map((r: unknown) => OrderSchema.parse(r));

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
  return OrderSchema.parse(resources[0]);
}
