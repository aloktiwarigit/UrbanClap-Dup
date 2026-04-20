import { getCosmosClient, DB_NAME } from './client.js';
import type { TechnicianKyc, KycStatus } from '../schemas/kyc.js';

const CONTAINER = 'technicians';

export async function upsertKycStatus(
  technicianId: string,
  patch: Partial<TechnicianKyc> & { kycStatus: KycStatus }
): Promise<void> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read();
  const existing = resource ?? { id: technicianId };
  const updated = {
    ...existing,
    kyc: {
      aadhaarVerified: false,
      aadhaarMaskedNumber: null,
      panNumber: null,
      panImagePath: null,
      kycStatus: 'PENDING' as KycStatus,
      ...(existing.kyc ?? {}),
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };
  await container.items.upsert(updated);
}

export async function getKycByTechnicianId(
  technicianId: string
): Promise<TechnicianKyc | null> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read();
  return (resource?.kyc as TechnicianKyc) ?? null;
}
