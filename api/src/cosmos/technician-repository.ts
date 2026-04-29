import { getCosmosClient, DB_NAME } from './client.js';
import { boundingBoxPolygon } from './geo.js';
import type { TechnicianKyc, KycStatus } from '../schemas/kyc.js';
import type { TechnicianProfile } from '../schemas/technician.js';

const CONTAINER = 'technicians';

// ── KYC methods (E02-S03 pattern) ────────────────────────────────────────────

interface TechnicianDoc {
  id: string;
  kyc?: Partial<TechnicianKyc>;
}

export async function upsertKycStatus(
  technicianId: string,
  patch: Partial<TechnicianKyc> & { kycStatus: KycStatus }
): Promise<void> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read<TechnicianDoc>();
  const existing: TechnicianDoc = resource ?? { id: technicianId };
  const updated: TechnicianDoc = {
    ...existing,
    kyc: {
      aadhaarVerified: false,
      aadhaarMaskedNumber: null,
      panNumber: null,
      panImagePath: null,
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
  const { resource } = await container.item(technicianId, technicianId).read<TechnicianDoc>();
  return (resource?.kyc as TechnicianKyc | undefined) ?? null;
}

// ── Geospatial profile methods (E05-S01) ─────────────────────────────────────

export async function upsertTechnicianProfile(profile: TechnicianProfile): Promise<void> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  await container.items.upsert(profile);
}

export async function getTechniciansWithinRadius(
  lat: number,
  lng: number,
  radiusKm: number,
  serviceId: string,
): Promise<TechnicianProfile[]> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const polygon = boundingBoxPolygon(lat, lng, radiusKm);
  const query = {
    query: `SELECT * FROM c
            WHERE ST_WITHIN(c.location, @polygon)
            AND ARRAY_CONTAINS(c.skills, @serviceId)
            AND c.kycStatus = "APPROVED"
            AND c.isOnline = true
            AND c.isAvailable = true`,
    parameters: [
      { name: '@polygon', value: polygon as unknown as string },
      { name: '@serviceId', value: serviceId },
    ],
  };
  const { resources } = await container.items
    .query<TechnicianProfile>(query)
    .fetchAll();
  return resources;
}

// ── Settlement helpers (E06-S04) ──────────────────────────────────────────────

export interface TechnicianSettlementInfo {
  id: string;
  completedJobCount: number;
  razorpayLinkedAccountId?: string;
  payoutCadence?: string;
}

export async function getTechnicianForSettlement(
  technicianId: string,
): Promise<TechnicianSettlementInfo | null> {
  const client = getCosmosClient();
  const { resource } = await client
    .database(DB_NAME)
    .container(CONTAINER)
    .item(technicianId, technicianId)
    .read<TechnicianSettlementInfo>();
  return resource ?? null;
}

export async function incrementCompletedJobCount(technicianId: string): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { resource, etag } = await container
      .item(technicianId, technicianId)
      .read<{ id: string; completedJobCount?: number } & Record<string, unknown>>();
    if (!resource) return;
    try {
      await container.item(technicianId, technicianId).replace(
        { ...resource, completedJobCount: (resource.completedJobCount ?? 0) + 1 },
        { accessCondition: { type: 'IfMatch', condition: etag ?? '' } },
      );
      return;
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 412 && attempt < maxRetries - 1) {
        continue;
      }
      throw err;
    }
  }
}

// ── Payout cadence helpers (E08-S02) ─────────────────────────────────────────

export async function updatePayoutCadence(
  technicianId: string,
  cadence: 'WEEKLY' | 'NEXT_DAY' | 'INSTANT',
): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { resource, etag } = await container
      .item(technicianId, technicianId)
      .read<{ id: string; payoutCadence?: string; payoutCadenceUpdatedAt?: string } & Record<string, unknown>>();
    if (!resource) return;
    try {
      await container.item(technicianId, technicianId).replace(
        { ...resource, payoutCadence: cadence, payoutCadenceUpdatedAt: new Date().toISOString() },
        { accessCondition: { type: 'IfMatch', condition: etag ?? '' } },
      );
      return;
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 412 && attempt < maxRetries - 1) {
        continue;
      }
      throw err;
    }
  }
}

export async function getTechnicianPayoutCadence(
  technicianId: string,
): Promise<string | null> {
  const { resource } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .item(technicianId, technicianId)
    .read<{ payoutCadence?: string }>();
  return resource?.payoutCadence ?? null;
}

// ── Shield helpers (E08-S04) ──────────────────────────────────────────────────

export async function addBlockedCustomer(
  technicianId: string,
  customerId: string,
): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { resource, etag } = await container
      .item(technicianId, technicianId)
      .read<{ id: string; blockedCustomerIds?: string[] } & Record<string, unknown>>();
    if (!resource) return;
    if (resource.blockedCustomerIds?.includes(customerId)) return; // idempotent
    const updated = {
      ...resource,
      blockedCustomerIds: [...(resource.blockedCustomerIds ?? []), customerId],
    };
    try {
      await container.item(technicianId, technicianId).replace(updated, {
        accessCondition: { type: 'IfMatch', condition: etag ?? '' },
      });
      return;
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 412 && attempt < maxRetries - 1) continue;
      throw err;
    }
  }
}

// ── Report helpers (E06-S05) ──────────────────────────────────────────────────

export interface TechnicianReportInfo {
  displayName: string;
  rating: number;
}

export async function getTechnicianForReport(
  technicianId: string,
): Promise<TechnicianReportInfo | null> {
  const { resource } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .item(technicianId, technicianId)
    .read<{ displayName?: string; rating?: number }>();
  if (!resource) return null;
  return { displayName: resource.displayName ?? 'Technician', rating: resource.rating ?? 0 };
}
