import { v4 as uuid } from 'uuid';
import { getCosmosClient, DB_NAME } from '../client.js';

export interface WaitlistDoc {
  id: string;
  phone: string;
  lat: number;
  lng: number;
  serviceId: string;
  requestedAt: string;
  sourceIp: string;
  createdAt: string;
}

function getContainer() {
  return getCosmosClient().database(DB_NAME).container('customer_waitlist');
}

export async function createWaitlistEntry(
  data: Omit<WaitlistDoc, 'id' | 'createdAt'>,
): Promise<WaitlistDoc> {
  const doc: WaitlistDoc = {
    id: uuid(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  await getContainer().items.create(doc);
  return doc;
}

// TODO(W6): admin read endpoint for waitlist CSV export (E16-S04b)
