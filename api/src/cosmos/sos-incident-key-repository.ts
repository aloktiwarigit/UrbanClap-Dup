import { getSosIncidentKeysContainer } from './client.js';
import type { SosIncidentKeyDoc } from '../schemas/sos.js';

const TTL_7_DAYS = 604_800;

export async function putKeyDoc(doc: Omit<SosIncidentKeyDoc, 'ttl' | 'createdAt'>): Promise<void> {
  const full: SosIncidentKeyDoc = {
    ...doc,
    createdAt: new Date().toISOString(),
    ttl: TTL_7_DAYS,
  };
  await getSosIncidentKeysContainer().items.create<SosIncidentKeyDoc>(full);
}

export async function getKeyDoc(
  incidentId: string,
  customerId: string,
): Promise<SosIncidentKeyDoc | null> {
  const { resource } = await getSosIncidentKeysContainer()
    .item(incidentId, customerId)
    .read<SosIncidentKeyDoc>();
  return resource ?? null;
}
