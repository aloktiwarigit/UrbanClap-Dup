import { getCosmosClient, DB_NAME } from './client.js';
import { boundingBoxPolygon, haversine } from './geo.js';
import { isPreconditionFailure, MAX_ETAG_ATTEMPTS } from './retry-utils.js';
import type { BookingDoc } from '../schemas/booking.js';
import type { TechnicianKyc, KycStatus } from '../schemas/kyc.js';
import type { AvailabilityWindow, CommissionHold, PaymentProfile, TechnicianProfile } from '../schemas/technician.js';

const CONTAINER = 'technicians';

/**
 * ETag-guarded read-modify-write for the `technicians` doc (E21-S02 Task 7). Every writer on
 * this doc must route through here: a bare read -> spread -> upsert lets a `.patch()` (e.g.
 * commissionHold, paymentProfile) landing between the read and the write get silently reverted.
 * `mutate` receives the current doc (or null when absent) and must return the full next doc —
 * it should spread `existing` first so it never drops fields it doesn't know about.
 */
async function readModifyWrite<T extends { id: string }>(
  technicianId: string,
  mutate: (existing: T | null) => T,
): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  for (let attempt = 0; attempt < MAX_ETAG_ATTEMPTS; attempt++) {
    const { resource, etag } = await container.item(technicianId, technicianId).read<T>();
    const next = mutate(resource ?? null);
    try {
      if (resource) {
        await container
          .item(technicianId, technicianId)
          .replace(next, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
      } else {
        await container.items.create(next);
      }
      return;
    } catch (err: unknown) {
      if (isPreconditionFailure(err) && attempt < MAX_ETAG_ATTEMPTS - 1) continue;
      throw err;
    }
  }
}

// ── KYC methods (E02-S03 pattern) ────────────────────────────────────────────

interface TechnicianDoc {
  id: string;
  kyc?: Partial<TechnicianKyc>;
}

export async function upsertKycStatus(
  technicianId: string,
  patch: Partial<TechnicianKyc> & { kycStatus: KycStatus }
): Promise<void> {
  await readModifyWrite<TechnicianDoc>(technicianId, (existing) => {
    const base: TechnicianDoc = existing ?? { id: technicianId };
    return {
      ...base,
      kyc: {
        aadhaarVerified: false,
        aadhaarMaskedNumber: null,
        panNumber: null,
        panMaskedNumber: null,
        panHash: null,
        panImagePath: null,
        ...(base.kyc ?? {}),
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    };
  });
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
  const updatedAt = new Date().toISOString();
  let result!: TechnicianAvailability;
  await readModifyWrite<Record<string, unknown> & { id: string }>(technicianId, (existing) => {
    const updated = {
      ...(existing ?? { id: technicianId, technicianId }),
      id: technicianId,
      technicianId: (existing?.technicianId as string | undefined) ?? technicianId,
      ...(patch.isOnline !== undefined ? { isOnline: patch.isOnline } : {}),
      ...(patch.isAvailable !== undefined ? { isAvailable: patch.isAvailable } : {}),
      ...(patch.availabilityWindows !== undefined ? { availabilityWindows: patch.availabilityWindows } : {}),
      updatedAt,
    };
    result = normalizeAvailability(updated);
    return updated;
  });
  return result;
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
  const updatedAt = new Date().toISOString();
  let result!: TechnicianServiceProfile;
  await readModifyWrite<Record<string, unknown> & { id: string }>(technicianId, (existing) => {
    const existingKyc = existing?.kyc as { kycStatus?: unknown } | undefined;
    const updated: Record<string, unknown> & { id: string } = {
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
    result = toServiceProfile(updated);
    return updated;
  });
  return result;
}

export interface DispatchPredicateOptions {
  /**
   * Exclude technicians whose commissionHold.state is BLOCKED. Driven by
   * `holdEnforcementEnabled`; off = dark launch, in which case the caller runs unfiltered and
   * shadow-logs the would-be exclusions instead (see services/dispatch-eligibility.ts).
   */
  excludeBlockedHolds?: boolean;
  /**
   * Require both automated KYC steps (DigiLocker Aadhaar + PAN OCR) to have succeeded. Driven by
   * `enforceKycInDispatch`; off = today's behaviour. See `KYC_VERIFIED_PREDICATE` below for the
   * two facts this actually checks, and why it does not read `kyc.kycStatus`.
   */
  requireKyc?: boolean;
}

/**
 * The always-on predicates. `suspended` is a BUG FIX (E21-S04): patchTechnicianAdminFields sets
 * `suspended:true` and `isOnline:false` together, so a suspended technician was excluded only as
 * a side effect of being offline — any path that flips isOnline back on silently re-admitted
 * them to dispatch.
 *
 * Every predicate here and below is written `(NOT IS_DEFINED(x) OR x != bad)`. Cosmos evaluates
 * `!=` against an undefined path to undefined, which drops the row — so a bare `!=` would
 * silently exclude every legacy document that lacks the field. The IS_DEFINED disjunct IS the
 * fail-open, and removing it is a dispatch outage.
 */
const DISPATCH_BASE_PREDICATES = `ST_WITHIN(c.location, @polygon)
            AND ARRAY_CONTAINS(c.skills, @serviceId)
            AND c.isOnline = true
            AND c.isAvailable = true
            AND (NOT IS_DEFINED(c.suspended) OR c.suspended != true)`;

const HOLD_NOT_BLOCKED_PREDICATE =
  `(NOT IS_DEFINED(c.commissionHold.state) OR c.commissionHold.state != 'BLOCKED')`;

/**
 * KYC-verified means BOTH automated KYC steps have succeeded — the DigiLocker Aadhaar step and
 * the PAN OCR step — as PRD FR-1.2/FR-3.1 require ("no half-verified dispatches").
 *
 * ── Why this reads two facts and not a status ────────────────────────────────────────────────
 * The obvious implementation is to test `kyc.kycStatus`. Do not. That field is a *progress
 * marker for a two-step process that is completable in either order*, and a single scalar cannot
 * express "both done". `submit-aadhaar.ts` sets it to `AADHAAR_DONE`; `submit-pan-ocr.ts` sets it
 * to `PAN_DONE`; whichever runs LAST wins, and neither endpoint checks that the other has run.
 * `COMPLETE` — the one value in `KycStatusSchema` that could mean "both done" — has no writer
 * anywhere in this codebase. So:
 *   - `kycStatus = 'PAN_DONE'`  admits PAN-only (Aadhaar never done)          → too loose
 *   - `kycStatus = 'AADHAAR_DONE'` is reached by a fully-verified technician who did PAN first
 *     and Aadhaar second, because the Aadhaar write overwrote the marker      → too strict
 * Three consecutive Codex review rounds on this predicate (E21-S04) each found a real defect,
 * in opposite directions, because each attempt was reading that scalar. Any fourth attempt to
 * "simplify" this back to a status comparison reintroduces one of those two bugs. Don't.
 *
 * ── The two facts ────────────────────────────────────────────────────────────────────────────
 * Instead, read one independent, per-step fact for each step. Each is written by exactly one
 * endpoint, and neither endpoint's patch carries the other's keys:
 *   - `kyc.aadhaarVerified === true` — `submit-aadhaar.ts` writes `true` ONLY after
 *     `exchangeCodeForAadhaar()` returns a DigiLocker result, and explicitly `false` on failure.
 *   - `kyc.panHash` present and non-null — `submit-pan-ocr.ts` writes `panHash` ONLY when the
 *     Form Recognizer read succeeds, and explicitly sets it back to `null` on rejection (so a
 *     later failed submission revokes an earlier pass; see the "stale masked number" comment
 *     there). `panHash` rather than `panMaskedNumber` because it is a SHA-256 of a successfully
 *     extracted PAN and has no legacy predecessor — the legacy fields are `panNumber` /
 *     `panNumberEncrypted`, which this predicate deliberately does NOT accept as proof.
 * `upsertKycStatus()` merges `defaults → ...(base.kyc ?? {}) → ...patch`, so each step's fields
 * survive the other step's write. THAT is what makes this predicate order-independent by
 * construction rather than by luck — it is true iff both steps have succeeded, in either order,
 * with retries, and it goes false again if either step is later rejected.
 *
 * ── The null trap ────────────────────────────────────────────────────────────────────────────
 * `IS_DEFINED(c.kyc.panHash)` alone is NOT enough. `upsertKycStatus()` defaults `panHash: null`
 * into every write, and `submit-pan-ocr.ts` writes an explicit `null` on rejection. Cosmos's
 * `IS_DEFINED` returns true for a property whose value is `null`, so every technician who has
 * ever touched the KYC flow — including one whose PAN was rejected — has `panHash` DEFINED.
 * `NOT IS_NULL(...)` is the clause that actually tests "a PAN was successfully read". Both
 * halves are load-bearing: `IS_NULL` is false for an *undefined* path too, so `NOT IS_NULL`
 * alone would admit a technician with no `panHash` key at all.
 *
 * ── Fail-open boundary ───────────────────────────────────────────────────────────────────────
 * The disjunct is `NOT IS_DEFINED(c.kyc)` — the absence of the WHOLE `kyc` sub-object, not the
 * absence of the two fields. `upsertKycStatus()` is the only writer of `c.kyc` in the codebase,
 * and it reconstructs from defaults that always include `aadhaarVerified: false` and
 * `panHash: null`; so any document the KYC flow has ever touched carries both keys, and the two
 * choices differ only for a document with a `kyc` object written some other way — i.e. a legacy
 * doc holding, say, `panNumberEncrypted` and nothing else. Such a document carries PARTIAL KYC
 * information (one step's worth), and partial information must fail CLOSED once the flag is on:
 * keying on the whole object excludes it, keying on the two fields would wrongly admit it.
 * A technician with no KYC information at all is still dispatched, exactly like the suspended
 * and hold predicates above. `docs/runbook.md` carries the precondition query that checks a
 * target environment for such legacy documents before `enforceKycInDispatch` is switched on.
 *
 * ── Cosmos evaluation, hand-traced ───────────────────────────────────────────────────────────
 * A comparison against an undefined path evaluates to `undefined`, which DROPS the row, and
 * `false OR undefined` is `undefined` — so the parenthesisation below is what decides whether a
 * whole class of technicians silently vanishes from dispatch:
 *   no `kyc` at all                    → true OR …                     → ADMITTED (fail-open)
 *   `kyc` present, neither field       → false OR (undefined AND false)→ EXCLUDED
 *   Aadhaar only (panHash null)        → false OR (true AND false)     → EXCLUDED
 *   PAN only (aadhaarVerified false)   → false OR (false AND …)        → EXCLUDED
 *   both, either order                 → false OR (true AND true)      → ADMITTED
 *   PAN rejected after a prior success → panHash back to null          → EXCLUDED
 *   Aadhaar failed                     → aadhaarVerified false         → EXCLUDED
 * (Cosmos's ternary table gives `undefined AND false` = `false`, so the second row lands on
 * EXCLUDED whichever side the engine evaluates first — but `false OR undefined` would be
 * `undefined`, which also drops the row. Both routes exclude; neither admits.)
 *
 * This predicate still does not depend on the KYC endpoints enforcing step order — it does not
 * need to, because it asserts the two outcomes directly rather than inferring them from a
 * sequence. Adding step-order enforcement to `submit-pan-ocr.ts` remains a separate follow-up.
 * See `docs/adr/0032-commission-hold-is-an-eligibility-gate.md` (Consequences — negative) for why
 * dispatch is the component that ends up defining "KYC verified" for this system at all.
 */
const KYC_VERIFIED_PREDICATE =
  `(NOT IS_DEFINED(c.kyc)
    OR (c.kyc.aadhaarVerified = true
        AND IS_DEFINED(c.kyc.panHash) AND NOT IS_NULL(c.kyc.panHash)))`;

export async function getTechniciansWithinRadius(
  lat: number,
  lng: number,
  radiusKm: number,
  serviceId: string,
  opts: DispatchPredicateOptions = {},
): Promise<TechnicianProfile[]> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const polygon = boundingBoxPolygon(lat, lng, radiusKm);

  const extra: string[] = [];
  if (opts.excludeBlockedHolds) extra.push(HOLD_NOT_BLOCKED_PREDICATE);
  if (opts.requireKyc) extra.push(KYC_VERIFIED_PREDICATE);

  const query = {
    query: `SELECT * FROM c
            WHERE ${DISPATCH_BASE_PREDICATES}${extra.map((p) => `\n            AND ${p}`).join('')}`,
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

/**
 * How many technicians inside the same geo/skill/online/available/not-suspended set are currently
 * BLOCKED by a commission hold. Called ONLY on the zero-candidate dispatch path, and only when
 * enforcement is on, so that `DISPATCH_NO_TECHS` can distinguish "nobody covers this area" from
 * "everyone who covers it owes us money" — with the predicate in the SQL, the excluded rows never
 * come back and the two are otherwise indistinguishable in the logs.
 */
export async function countBlockedInRadius(
  lat: number,
  lng: number,
  radiusKm: number,
  serviceId: string,
): Promise<number> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const polygon = boundingBoxPolygon(lat, lng, radiusKm);
  const { resources } = await container.items
    .query<number>({
      query: `SELECT VALUE COUNT(1) FROM c
              WHERE ${DISPATCH_BASE_PREDICATES}
              AND c.commissionHold.state = 'BLOCKED'`,
      parameters: [
        { name: '@polygon', value: polygon as unknown as string },
        { name: '@serviceId', value: serviceId },
      ],
    })
    .fetchAll();
  return resources[0] ?? 0;
}

/**
 * Point read (single partition) of the two fields an admin reassign audit entry records about
 * its target: the commission hold and the suspension flag. Both are absent on legacy documents,
 * which reads as `hold: null, suspended: false` — the audit entry then records "no hold known",
 * which is exactly true.
 */
export async function readTechnicianGateState(
  technicianId: string,
): Promise<{ exists: boolean; hold: CommissionHold | null; suspended: boolean }> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const { resource } = await container
    .item(technicianId, technicianId)
    .read<{ commissionHold?: CommissionHold; suspended?: boolean }>();
  if (!resource) return { exists: false, hold: null, suspended: false };
  return {
    exists: true,
    hold: resource.commissionHold ?? null,
    suspended: resource.suspended === true,
  };
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
      return { tech: tech, distanceKm };
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
  commissionHold?: CommissionHold;
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
  await readModifyWrite<Record<string, unknown> & { id: string }>(id, (existing) => ({
    ...(existing ?? { id }),
    id,
    ...(patch.isOnline !== undefined ? { isOnline: patch.isOnline } : {}),
    ...(patch.suspended !== undefined ? { suspended: patch.suspended } : {}),
    ...(patch.commissionPct !== undefined ? { commissionPct: patch.commissionPct } : {}),
    ...(patch.skills !== undefined ? { skills: patch.skills } : {}),
    updatedAt: new Date().toISOString(),
  }));
}

/** ETag-guarded write of the technician's FCM push token (moved out of the HTTP handler). */
export async function patchFcmToken(technicianId: string, token: string): Promise<void> {
  await readModifyWrite<Record<string, unknown> & { id: string }>(technicianId, (existing) => ({
    ...(existing ?? { id: technicianId }),
    id: technicianId,
    fcmToken: token,
  }));
}

// ── Commission hold helpers (E21-S02) ─────────────────────────────────────────

/**
 * Point read of the technician's cached commissionHold. `exists` distinguishes an absent
 * technician doc (recompute must give up — nothing to patch) from an existing doc that simply
 * has no commissionHold field yet (recompute should still patch one in).
 */
export async function readCommissionHold(
  technicianId: string,
): Promise<{ hold: CommissionHold | null; exists: boolean }> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const { resource } = await container
    .item(technicianId, technicianId)
    .read<{ id: string; commissionHold?: CommissionHold }>();
  return { exists: Boolean(resource), hold: resource?.commissionHold ?? null };
}

/**
 * Writes /commissionHold via a conditional Cosmos PATCH so a stale (slower) recompute can never
 * clobber a fresher one that already landed. `readStartedAt` is the caller's read-start
 * timestamp (server-generated ISO-8601, so string comparison is chronological): the condition
 * only allows the write when the stored commissionHold is missing, has no evaluatedAt, or is
 * older than the recompute that produced this write.
 */
export async function patchCommissionHold(
  technicianId: string,
  hold: CommissionHold,
  readStartedAt: string,
): Promise<'APPLIED' | 'STALE' | 'MISSING'> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  // readStartedAt is server-generated ISO-8601 (Date.toISOString()), never user input, and is
  // appended by string concatenation (not template-literal interpolation) — not the pattern
  // `no-user-controlled-cosmos-query` guards against (that rule targets items.query() filters).
  const condition =
    'FROM c WHERE NOT IS_DEFINED(c.commissionHold) OR NOT IS_DEFINED(c.commissionHold.evaluatedAt) OR c.commissionHold.evaluatedAt < "' +
    readStartedAt +
    '"';
  try {
    await container.item(technicianId, technicianId).patch({
      operations: [{ op: 'set', path: '/commissionHold', value: hold }],
      condition,
    });
    return 'APPLIED';
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 412) return 'STALE';
    if (code === 404) return 'MISSING';
    throw err;
  }
}

const LIST_WITH_HOLD_QUERY = 'SELECT c.id, c.displayName, c.name, c.commissionHold FROM c WHERE IS_DEFINED(c.commissionHold)';

interface TechnicianWithHoldRow {
  id: string;
  displayName?: string;
  name?: string;
  commissionHold: CommissionHold;
}

function toHoldItem(r: TechnicianWithHoldRow): { id: string; name?: string; commissionHold: CommissionHold } {
  return {
    id: r.id,
    ...(r.displayName ?? r.name ? { name: (r.displayName ?? r.name) as string } : {}),
    commissionHold: r.commissionHold,
  };
}

/**
 * Pages through every technician doc that currently carries a commissionHold, one page at a
 * time. Used by the admin dashboard (Task 10), which needs a stable page size rather than the
 * whole roster at once. Sorted by outstandingPaise desc within the page only — no composite
 * index required; ordering across pages is not guaranteed.
 */
// SEMGREP-JUSTIFIED: cross-partition by design — a paged admin-only roster view. No caller in
// api/src/functions/ today (the dashboard uses listAllTechniciansWithHold); any future caller
// must carry requireAdmin, which the Layer-2 caller-scope test enforces.
export async function listTechniciansWithHold(continuationToken?: string): Promise<{
  items: Array<{ id: string; name?: string; commissionHold: CommissionHold }>;
  continuationToken?: string;
}> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const iterator = container.items.query<TechnicianWithHoldRow>(
    { query: LIST_WITH_HOLD_QUERY },
    { maxItemCount: 50, ...(continuationToken ? { continuationToken } : {}) },
  );
  const page = await iterator.fetchNext();
  const items = (page.resources ?? []).map(toHoldItem).sort((a, b) => b.commissionHold.outstandingPaise - a.commissionHold.outstandingPaise);
  return { items, ...(page.continuationToken ? { continuationToken: page.continuationToken } : {}) };
}

/**
 * Drains every technician doc that currently carries a commissionHold in one call. Used by
 * `sweepAllHolds`, which needs the full set (unioned with the DUE-side aggregate) rather than a
 * single page — a technician whose balance just dropped to zero must still be found here so it
 * can be recomputed down to CLEAR/0.
 */
// SEMGREP-JUSTIFIED: cross-partition by design — the hold sweep and the reconciliation summary
// need the whole roster. Callers are requireAdmin handlers or the app.timer reconciler; the query
// takes no parameters at all, so no user input can reach it.
export async function listAllTechniciansWithHold(): Promise<
  Array<{ id: string; name?: string; commissionHold: CommissionHold }>
> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const iterator = container.items.query<TechnicianWithHoldRow>({ query: LIST_WITH_HOLD_QUERY }, { maxItemCount: 50 });
  const items: Array<{ id: string; name?: string; commissionHold: CommissionHold }> = [];
  while (iterator.hasMoreResults()) {
    const page = await iterator.fetchNext();
    items.push(...(page.resources ?? []).map(toHoldItem));
  }
  return items;
}

/**
 * Ids of technicians whose commissionHold.override has expired as of `nowIso` (inclusive: `<=`
 * matches an override that expires at exactly `nowIso`). Drives the E21-S04 reconciler's
 * EXPIRED_OVERRIDES sweep scope — an expired override otherwise sits inert until *something else*
 * touches that technician's receivables and triggers a recompute, silently under-enforcing a hold
 * that should have resumed.
 */
// SEMGREP-JUSTIFIED: cross-partition by design — drives the reconciler's EXPIRED_OVERRIDES sweep.
// Sole caller is the app.timer reconciler; the only parameter is a server-generated timestamp.
export async function listTechniciansWithExpiredOverride(nowIso: string): Promise<string[]> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const iterator = container.items.query<{ id: string }>(
    {
      query: 'SELECT c.id FROM c WHERE IS_DEFINED(c.commissionHold.override) AND c.commissionHold.override.until <= @now',
      parameters: [{ name: '@now', value: nowIso }],
    },
    { maxItemCount: 100 },
  );
  const ids: string[] = [];
  while (iterator.hasMoreResults()) {
    const page = await iterator.fetchNext();
    ids.push(...(page.resources ?? []).map((r) => r.id));
  }
  return ids;
}

/** Writes /paymentProfile via PATCH. Throws TECHNICIAN_NOT_FOUND (code) when the doc is absent. */
export async function patchPaymentProfile(technicianId: string, profile: PaymentProfile): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  try {
    await container.item(technicianId, technicianId).patch({
      operations: [{ op: 'set', path: '/paymentProfile', value: profile }],
    });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 404) {
      throw Object.assign(new Error('TECHNICIAN_NOT_FOUND'), { code: 'TECHNICIAN_NOT_FOUND' });
    }
    throw err;
  }
}
