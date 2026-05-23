import type { CosmosClient, SqlParameter } from '@azure/cosmos';
import { getCosmosClient, DB_NAME } from './client.js';
import { OrderSchema, type Order, type OrderListQuery, type OrderListResponse } from '../schemas/order.js';
import { catalogueRepo } from './catalogue-repository.js';
import { getTechniciansByIds } from './technician-repository.js';
import { getFirebaseAdmin } from '../services/firebaseAdmin.js';
import { getStorageDownloadUrl } from '../firebase/admin.js';

const PHOTO_STAGE_ORDER = ['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'];

function getContainer(client: CosmosClient) {
  return client.database(DB_NAME).container('bookings');
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asPhotoRecord(value: unknown): Record<string, string[]> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};

  const result: Record<string, string[]> = {};
  for (const [stage, refs] of Object.entries(value)) {
    if (!Array.isArray(refs)) continue;
    const cleanRefs = refs.filter((ref): ref is string => typeof ref === 'string' && ref.trim() !== '');
    if (cleanRefs.length > 0) result[stage] = cleanRefs;
  }
  return result;
}

async function toPhotoUrl(photoRef: string): Promise<string | null> {
  if (/^data:image\/jpe?g;base64,/.test(photoRef)) return photoRef;
  try {
    return await getStorageDownloadUrl(photoRef);
  } catch {
    return null;
  }
}

async function buildJobPhotoSets(raw: Record<string, unknown>): Promise<Order['jobPhotoSets']> {
  const photos = asPhotoRecord(raw['photos']);
  const orderedStages = [
    ...PHOTO_STAGE_ORDER.filter((stage) => photos[stage]?.length),
    ...Object.keys(photos).filter((stage) => !PHOTO_STAGE_ORDER.includes(stage)),
  ];

  const sets = await Promise.all(
    orderedStages.map(async (stage) => {
      const urls = (await Promise.all((photos[stage] ?? []).map(toPhotoUrl)))
        .filter((url): url is string => typeof url === 'string' && url.length > 0);
      return urls.length > 0 ? { stage, urls } : null;
    }),
  );

  const visibleSets = sets.filter((set): set is NonNullable<typeof set> => set !== null);
  return visibleSets.length > 0 ? visibleSets : undefined;
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

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim() !== ''))];
}

function isGeneratedCustomerName(customerName: string, customerId: string): boolean {
  return customerName === `Customer ${customerId.slice(0, 8)}`;
}

async function fetchServiceNames(serviceIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  await Promise.all(
    serviceIds.map(async (serviceId) => {
      try {
        const service = await catalogueRepo.getServiceByIdCrossPartition(serviceId);
        if (service?.name) names.set(serviceId, service.name);
      } catch {
        // Admin orders must still render even if catalogue enrichment is temporarily unavailable.
      }
    }),
  );
  return names;
}

async function fetchTechnicianNames(technicianIds: string[]): Promise<Map<string, string>> {
  try {
    const techs = await getTechniciansByIds(technicianIds);
    const names = new Map<string, string>();
    for (const tech of techs) {
      const displayName = tech.displayName?.trim() || tech.name?.trim() || tech.technicianId || tech.id;
      if (tech.id) names.set(tech.id, displayName);
      if (tech.technicianId) names.set(tech.technicianId, displayName);
    }
    return names;
  } catch {
    return new Map();
  }
}

interface CustomerProfile {
  displayName?: string;
  phoneNumber?: string;
  email?: string;
}

async function fetchCustomerProfiles(customerIds: string[]): Promise<Map<string, CustomerProfile>> {
  if (customerIds.length === 0) return new Map();

  try {
    const auth = getFirebaseAdmin().auth();
    const profiles = new Map<string, CustomerProfile>();
    for (let index = 0; index < customerIds.length; index += 100) {
      const result = await auth.getUsers(customerIds.slice(index, index + 100).map((uid) => ({ uid })));
      for (const user of result.users) {
        profiles.set(user.uid, {
          ...(user.displayName ? { displayName: user.displayName } : {}),
          ...(user.phoneNumber ? { phoneNumber: user.phoneNumber } : {}),
          ...(user.email ? { email: user.email } : {}),
        });
      }
    }
    return profiles;
  } catch {
    return new Map();
  }
}

async function hydrateOrders(orders: Order[]): Promise<Order[]> {
  if (orders.length === 0) return orders;

  const [serviceNames, technicianNames, customerProfiles] = await Promise.all([
    fetchServiceNames(unique(orders.map((order) => order.serviceId))),
    fetchTechnicianNames(unique(orders.map((order) => order.technicianId))),
    fetchCustomerProfiles(unique(orders.map((order) => order.customerId))),
  ]);

  return orders.map((order) => {
    const customerProfile = customerProfiles.get(order.customerId);
    const customerName = isGeneratedCustomerName(order.customerName, order.customerId)
      ? customerProfile?.displayName ?? customerProfile?.phoneNumber ?? order.customerName
      : order.customerName;

    return OrderSchema.parse({
      ...order,
      customerName,
      customerPhone: order.customerPhone || customerProfile?.phoneNumber || '',
      serviceName: order.serviceName ?? (order.serviceId ? serviceNames.get(order.serviceId) : undefined),
      technicianName: order.technicianName ?? (order.technicianId ? technicianNames.get(order.technicianId) : undefined),
    });
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
  const items: Order[] = await hydrateOrders(resources.map(toAdminOrder));

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
  const raw = resources[0] as Record<string, unknown>;
  const order = (await hydrateOrders([toAdminOrder(raw)]))[0];
  if (!order) return null;
  const jobPhotoSets = await buildJobPhotoSets(raw);
  return OrderSchema.parse({
    ...order,
    ...(jobPhotoSets ? { jobPhotoSets } : {}),
  });
}
