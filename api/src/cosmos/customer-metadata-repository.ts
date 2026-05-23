import { getCosmosClient, DB_NAME } from './client.js';

const CONTAINER = 'customer-metadata';

interface CustomerMetadataDoc {
  id: string;
  flagged?: boolean;
  notes?: Array<{ text: string; createdAt: string; authorName: string }>;
}

function getContainer() {
  return getCosmosClient().database(DB_NAME).container(CONTAINER);
}

export async function getCustomerMetadata(
  customerIds: string[],
): Promise<Map<string, CustomerMetadataDoc>> {
  if (customerIds.length === 0) return new Map();
  const container = getContainer();
  const ids = customerIds.slice(0, 200);
  const { resources } = await container.items
    .query<CustomerMetadataDoc>({
      query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
      parameters: [{ name: '@ids', value: ids }],
    })
    .fetchAll();
  return new Map(resources.map((r) => [r.id, r]));
}

export async function patchCustomerMetadata(
  customerId: string,
  patch: { flagged?: boolean },
): Promise<void> {
  const container = getContainer();
  let resource: CustomerMetadataDoc | undefined;
  try {
    const result = await container.item(customerId, customerId).read<CustomerMetadataDoc>();
    resource = result.resource;
  } catch {
    resource = undefined;
  }
  const doc: CustomerMetadataDoc = {
    ...(resource ?? { id: customerId, notes: [] }),
    id: customerId,
    ...patch,
  };
  await container.items.upsert(doc);
}

export async function addCustomerNote(
  customerId: string,
  note: { text: string; createdAt: string; authorName: string },
): Promise<void> {
  const container = getContainer();
  let resource: CustomerMetadataDoc | undefined;
  try {
    const result = await container.item(customerId, customerId).read<CustomerMetadataDoc>();
    resource = result.resource;
  } catch {
    resource = undefined;
  }
  const doc: CustomerMetadataDoc = {
    ...(resource ?? { id: customerId, flagged: false }),
    id: customerId,
    notes: [...(resource?.notes ?? []), note],
  };
  await container.items.upsert(doc);
}
