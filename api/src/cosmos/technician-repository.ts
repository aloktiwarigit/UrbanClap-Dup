import { getCosmosClient, DB_NAME } from './client.js';
import { boundingBoxPolygon, haversine } from './geo.js';
import type { BookingDoc } from '../schemas/booking.js';
import type { TechnicianKyc, KycStatus } from '../schemas/kyc.js';
import type { AvailabilityWindow, TechnicianProfile } from '../schemas/technician.js';

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

export interface TechnicianAvailability {
  isOnline: boolean;
  isAvailable: boolean;
  availabilityWindows: AvailabilityWindow[];
  updatedAt?: string;
}

export interface TechnicianAvailabilityPatch {
  isOnline?: boolean | undefined;
  isAvailable?: boolean | undefined;
  availabilityWindows?: AvailabilityWindow[] | undefined;
}

export interface TechnicianServiceLocation {
  lat: number;
  lng: number;
}

export interface TechnicianServiceProfile {
  skills: string[];
  location: TechnicianServiceLocation | null;
}

export interface TechnicianServiceProfilePatch {
  skills: string[];
  location?: TechnicianServiceLocation | undefined;
}

const defaultAvailabilityWindows = (): AvailabilityWindow[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => [
    { dayOfWeek, startHour: 8, endHour: 12 },
    { dayOfWeek, startHour: 12, endHour: 17 },
  ]).flat();

function normalizeAvailability(doc?: Partial<TechnicianProfile> & Record<string, unknown>): TechnicianAvailability {
  const availability: TechnicianAvailability = {
    isOnline: typeof doc?.isOnline === 'boolean' ? doc.isOnline : true,
    isAvailable: typeof doc?.isAvailable === 'boolean' ? doc.isAvailable : true,
    availabilityWindows: Array.isArray(doc?.availabilityWindows)
      ? doc.availabilityWindows
      : defaultAvailabilityWindows(),
  };
  if (typeof doc?.updatedAt === 'string') availability.updatedAt = doc.updatedAt;
  return availability;
}

export async function getTechnicianAvailability(technicianId: string): Promise<TechnicianAvailability> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read<Partial<TechnicianProfile> & Record<string, unknown>>();
  return normalizeAvailability(resource);
}

export async function patchTechnicianAvailability(
  technicianId: string,
  patch: TechnicianAvailabilityPatch,
): Promise<TechnicianAvailability> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read<Record<string, unknown>>();
  const updatedAt = new Date().toISOString();
  const updated = {
    ...(resource ?? { id: technicianId, technicianId }),
    id: technicianId,
    technicianId: (resource?.technicianId as string | undefined) ?? technicianId,
    ...(patch.isOnline !== undefined ? { isOnline: patch.isOnline } : {}),
    ...(patch.isAvailable !== undefined ? { isAvailable: patch.isAvailable } : {}),
    ...(patch.availabilityWindows !== undefined ? { availabilityWindows: patch.availabilityWindows } : {}),
    updatedAt,
  };
  await container.items.upsert(updated);
  return normalizeAvailability(updated);
}

async function readTechnicianDocument(technicianId: string): Promise<Record<string, unknown> | null> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  try {
    const { resource } = await container.item(technicianId, technicianId).read<Record<string, unknown>>();
    return resource ?? null;
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 404) return null;
    throw err;
  }
}

function toServiceProfile(doc: Record<string, unknown> | null): TechnicianServiceProfile {
  const skills = Array.isArray(doc?.skills) ? doc.skills.filter((skill): skill is string => typeof skill === 'string') : [];
  const location = doc?.location as { coordinates?: unknown } | undefined;
  const coordinates = location?.coordinates;
  const hasCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number';
  return {
    skills,
    location: hasCoordinates ? { lat: coordinates[1] as number, lng: coordinates[0] as number } : null,
  };
}

export async function getTechnicianServiceProfile(
  technicianId: string,
): Promise<TechnicianServiceProfile> {
  return toServiceProfile(await readTechnicianDocument(technicianId));
}

export async function patchTechnicianServiceProfile(
  technicianId: string,
  patch: TechnicianServiceProfilePatch,
): Promise<TechnicianServiceProfile> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const existing = await readTechnicianDocument(technicianId);
  const existingKyc = existing?.kyc as { kycStatus?: unknown } | undefined;
  const updatedAt = new Date().toISOString();
  const updated: Record<string, unknown> = {
    ...(existing ?? {}),
    id: technicianId,
    technicianId: typeof existing?.technicianId === 'string' ? existing.technicianId : technicianId,
    skills: patch.skills,
    availabilityWindows: Array.isArray(existing?.availabilityWindows) ? existing.availabilityWindows : [],
    isOnline: typeof existing?.isOnline === 'boolean' ? existing.isOnline : false,
    isAvailable: typeof existing?.isAvailable === 'boolean' ? existing.isAvailable : false,
    kycStatus: typeof existing?.kycStatus === 'string'
      ? existing.kycStatus
      : typeof existingKyc?.kycStatus === 'string'
        ? existingKyc.kycStatus
        : 'PENDING',
    updatedAt,
  };
  if (patch.location !== undefined) {
    updated.location = { type: 'Point', coordinates: [patch.location.lng, patch.location.lat] };
  }
  await container.items.upsert(updated);
  return toServiceProfile(updated);
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

export interface TechnicianLookupInfo {
  id: string;
  technicianId: string;
  displayName?: string;
  name?: string;
  rating?: number;
  isOnline?: boolean;
  isAvailable?: boolean;
}

export async function getTechniciansByIds(
  technicianIds: string[],
): Promise<TechnicianLookupInfo[]> {
  const ids = [...new Set(technicianIds.filter(Boolean))];
  if (ids.length === 0) return [];

  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resources } = await container.items
    .query<TechnicianLookupInfo>({
      query: `SELECT c.id, c.technicianId, c.displayName, c.name, c.rating, c.isOnline, c.isAvailable
              FROM c
              WHERE ARRAY_CONTAINS(@ids, c.id) OR ARRAY_CONTAINS(@ids, c.technicianId)`,
      parameters: [{ name: '@ids', value: ids }],
    })
    .fetchAll();
  return resources;
}

function technicianDisplayName(tech: TechnicianProfile & Record<string, unknown>): string {
  const displayName = tech['displayName'];
  if (typeof displayName === 'string' && displayName.trim() !== '') return displayName;
  const name = tech['name'];
  if (typeof name === 'string' && name.trim() !== '') return name;
  return tech.technicianId || tech.id;
}

export interface TechnicianCandidate {
  technicianId: string;
  displayName: string;
  distanceKm: number;
  rating?: number;
  isOnline: boolean;
  isAvailable: boolean;
}

export async function getTechnicianCandidatesForBooking(
  booking: BookingDoc,
  radiusKm: number,
): Promise<TechnicianCandidate[]> {
  const { lat, lng } = booking.addressLatLng;
  const assignedTechnicianIds = new Set(booking.technicianId ? [booking.technicianId] : []);
  const candidates = await getTechniciansWithinRadius(lat, lng, radiusKm, booking.serviceId);
  return candidates
    .map((tech) => {
      const distanceKm = haversine(lat, lng, tech.location.coordinates[1], tech.location.coordinates[0]);
      return { tech: tech as TechnicianProfile & Record<string, unknown>, distanceKm };
    })
    .filter(({ tech, distanceKm }) =>
      distanceKm <= radiusKm &&
      !assignedTechnicianIds.has(tech.id) &&
      !assignedTechnicianIds.has(tech.technicianId)
    )
    .filter(({ tech }) => !(tech.blockedCustomerIds ?? []).includes(booking.customerId))
    .sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return (b.tech.rating ?? 0) - (a.tech.rating ?? 0);
    })
    .map(({ tech, distanceKm }) => {
      const candidate: TechnicianCandidate = {
        technicianId: tech.technicianId || tech.id,
        displayName: technicianDisplayName(tech),
        distanceKm: Number(distanceKm.toFixed(2)),
        isOnline: tech.isOnline,
        isAvailable: tech.isAvailable,
      };
      if (tech.rating !== undefined) candidate.rating = tech.rating;
      return candidate;
    });
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

// ── Admin roster helpers (E09-S07a) ───────────────────────────────────────────

export interface TechnicianAdminDoc {
  id: string;
  displayName?: string;
  name?: string;
  isOnline?: boolean;
  suspended?: boolean;
  kycStatus?: string;
  skills?: string[];
  commissionPct?: number;
  updatedAt?: string;
}

export async function listAllTechniciansForAdmin(): Promise<TechnicianAdminDoc[]> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resources } = await container.items
    .query<TechnicianAdminDoc>('SELECT * FROM c')
    .fetchAll();
  return resources;
}

export async function patchTechnicianAdminFields(
  id: string,
  patch: { isOnline?: boolean; suspended?: boolean; commissionPct?: number; skills?: string[] },
): Promise<void> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(id, id).read<Record<string, unknown>>();
  const updated = {
    ...(resource ?? { id }),
    id,
    ...(patch.isOnline !== undefined ? { isOnline: patch.isOnline } : {}),
    ...(patch.suspended !== undefined ? { suspended: patch.suspended } : {}),
    ...(patch.commissionPct !== undefined ? { commissionPct: patch.commissionPct } : {}),
    ...(patch.skills !== undefined ? { skills: patch.skills } : {}),
    updatedAt: new Date().toISOString(),
  };
  await container.items.upsert(updated);
}
