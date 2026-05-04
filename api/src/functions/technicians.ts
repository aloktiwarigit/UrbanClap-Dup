import { z } from 'zod';
import { type HttpHandler, type HttpRequest, type HttpResponseInit, type InvocationContext, app } from '@azure/functions';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { requireCustomer } from '../middleware/requireCustomer.js';
import { getCosmosClient, DB_NAME } from '../cosmos/client.js';
import {
  getTechnicianAvailability,
  getTechnicianServiceProfile,
  patchTechnicianAvailability,
  patchTechnicianServiceProfile,
} from '../cosmos/technician-repository.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { TechnicianDossierSchema } from '../schemas/technician-dossier.js';
import { ConfidenceScoreQuerySchema } from '../schemas/confidence-score.js';
import type { CustomerContext } from '../types/customer.js';
import '../bootstrap.js';

const PatchFcmTokenBodySchema = z.object({
  fcmToken: z.string().min(1),
});

const AvailabilityWindowBodySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
}).refine(window => window.endHour > window.startHour, {
  message: 'endHour must be after startHour',
  path: ['endHour'],
});

const PatchAvailabilityBodySchema = z.object({
  isOnline: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  availabilityWindows: z.array(AvailabilityWindowBodySchema).optional(),
}).refine(body => Object.keys(body).length > 0, {
  message: 'At least one availability field is required',
});

const PatchServiceProfileBodySchema = z.object({
  skills: z.array(z.string().min(1)).nonempty().superRefine((skills, ctx) => {
    const seen = new Map<string, number>();
    skills.forEach((skill, index) => {
      const firstIndex = seen.get(skill);
      if (firstIndex !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: `skills must be unique; duplicate of index ${firstIndex}`,
        });
        return;
      }
      seen.set(skill, index);
    });
  }),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
}).strict();

export const patchFcmTokenHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  let uid: string;
  try {
    const decoded = await verifyTechnicianToken(req);
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  let body: { fcmToken: string };
  try {
    const raw: unknown = await req.json();
    const result = PatchFcmTokenBodySchema.safeParse(raw);
    if (!result.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
    }
    body = result.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  const container = getCosmosClient().database(DB_NAME).container('technicians');
  const { resource: existing } = await container.item(uid, uid).read<Record<string, unknown>>();
  const doc = { ...(existing ?? { id: uid }), fcmToken: body.fcmToken };
  await container.items.upsert(doc);

  return { status: 200, jsonBody: { ok: true } };
};

export const getMyTechnicianAvailabilityHandler: HttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  try {
    return { status: 200, jsonBody: await getTechnicianAvailability(uid) };
  } catch (err: unknown) {
    ctx.error('getMyTechnicianAvailability failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

export const patchMyTechnicianAvailabilityHandler: HttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  let body: z.infer<typeof PatchAvailabilityBodySchema>;
  try {
    const raw: unknown = await req.json();
    const parsed = PatchAvailabilityBodySchema.safeParse(raw);
    if (!parsed.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
    }
    body = parsed.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  try {
    return { status: 200, jsonBody: await patchTechnicianAvailability(uid, body) };
  } catch (err: unknown) {
    ctx.error('patchMyTechnicianAvailability failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

export const getMyTechnicianServiceProfileHandler: HttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  try {
    return { status: 200, jsonBody: await getTechnicianServiceProfile(uid) };
  } catch (err: unknown) {
    ctx.error('getMyTechnicianServiceProfile failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

export const patchMyTechnicianServiceProfileHandler: HttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  let body: z.infer<typeof PatchServiceProfileBodySchema>;
  try {
    const raw: unknown = await req.json();
    const parsed = PatchServiceProfileBodySchema.safeParse(raw);
    if (!parsed.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
    }
    body = parsed.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  let issues: z.ZodIssue[];
  try {
    const validationResults: Array<z.ZodIssue | null> = await Promise.all(body.skills.map(async (skill, index) => {
      const service = await catalogueRepo.getServiceByIdCrossPartition(skill);
      if (!service || service.isActive !== true) {
        const issue: z.ZodIssue = {
          code: z.ZodIssueCode.custom,
          path: ['skills', index],
          message: 'skill must reference an active catalogue service',
        };
        return issue;
      }
      return null;
    }));
    issues = validationResults.filter((issue): issue is z.ZodIssue => issue !== null);
  } catch (err: unknown) {
    ctx.error('patchMyTechnicianServiceProfile catalogue validation failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
  if (issues.length > 0) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues } };
  }

  try {
    return { status: 200, jsonBody: await patchTechnicianServiceProfile(uid, body) };
  } catch (err: unknown) {
    ctx.error('patchMyTechnicianServiceProfile failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

app.http('patchTechnicianFcmToken', {
  route: 'v1/technicians/fcm-token',
  methods: ['PATCH'],
  handler: patchFcmTokenHandler,
});

app.http('getMyTechnicianAvailability', {
  route: 'v1/technicians/me/availability',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getMyTechnicianAvailabilityHandler,
});

app.http('patchMyTechnicianAvailability', {
  route: 'v1/technicians/me/availability',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: patchMyTechnicianAvailabilityHandler,
});

app.http('getMyTechnicianServiceProfile', {
  route: 'v1/technicians/me/service-profile',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getMyTechnicianServiceProfileHandler,
});

app.http('patchMyTechnicianServiceProfile', {
  route: 'v1/technicians/me/service-profile',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: patchMyTechnicianServiceProfileHandler,
});

export const getTechnicianProfileHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  const id = req.params['id'];
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const container = getCosmosClient().database(DB_NAME).container('technicians');
  const { resource } = await container.item(id, id).read<Record<string, unknown>>();
  if (!resource) return { status: 404, jsonBody: { code: 'NOT_FOUND' } };

  const parsed = TechnicianDossierSchema.safeParse({
    ...resource,
    id,
    displayName: resource['displayName'] ?? resource['name'] ?? undefined,
  });
  if (!parsed.success) return { status: 404, jsonBody: { code: 'NOT_FOUND' } };

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    jsonBody: parsed.data,
  };
};

app.http('getTechnicianProfile', {
  route: 'v1/technicians/{id}/profile',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getTechnicianProfileHandler,
});

// ── Confidence Score ──────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface BookingForScore {
  id: string;
  status: string;
  slotDate: string;
  slotWindow: string;
  startedAt?: string;
}

const LATE_MS = 15 * 60 * 1000;
const LIMITED_THRESHOLD = 20;
const AVG_SPEED_KMH = 20;

export const getConfidenceScoreHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  _customer: CustomerContext,
): Promise<HttpResponseInit> => {
  const technicianId = req.params['id'];
  if (!technicianId) {
    return { status: 400, jsonBody: { code: 'MISSING_PARAM', param: 'id' } };
  }
  const queryResult = ConfidenceScoreQuerySchema.safeParse({
    lat: req.query.get('lat') ?? undefined,
    lng: req.query.get('lng') ?? undefined,
  });
  if (!queryResult.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: queryResult.error.issues } };
  }
  const { lat, lng } = queryResult.data;

  const db = getCosmosClient().database(DB_NAME);
  const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { resources: bookings } = await db
    .container('bookings')
    .items.query<BookingForScore>({
      query: `SELECT c.id, c.status, c.slotDate, c.slotWindow, c.startedAt
              FROM c
              WHERE c.technicianId = @techId
                AND c.status IN ('COMPLETED', 'PAID')
                AND c.slotDate >= @sinceDate`,
      parameters: [
        { name: '@techId', value: technicianId },
        { name: '@sinceDate', value: sinceDate },
      ],
    })
    .fetchAll();

  let onTimeCount = 0;
  let timedBookings = 0;
  for (const b of bookings) {
    if (!b.startedAt) continue;
    timedBookings++;
    const [hh, mm] = (b.slotWindow.split('-')[0] ?? '').split(':').map(Number);
    const slotStart = new Date(`${b.slotDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00.000Z`);
    if (new Date(b.startedAt).getTime() - slotStart.getTime() <= LATE_MS) onTimeCount++;
  }
  const onTimePercent = timedBookings > 0 ? Math.round((onTimeCount / timedBookings) * 100) : 0;

  let techDoc: { id: string; location?: { type: string; coordinates: [number, number] } } | undefined;
  try {
    // technicians collection is partitioned by the technician's UID (same key as id).
    const result = await db
      .container('technicians')
      .item(technicianId, technicianId)
      .read<{ id: string; location?: { type: string; coordinates: [number, number] } }>();
    techDoc = result.resource;
    if (!techDoc) {
      return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };
    }
  } catch (err) {
    const cosmosErr = err as { code?: number };
    if (cosmosErr.code === 404) return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };
    throw err;
  }

  const areaRating: number | null = null; // deferred until per-booking ratings are collected

  const hasCustomerLocation = lat !== 0.0 || lng !== 0.0;
  let nearestEtaMinutes: number | null = null;
  if (hasCustomerLocation && techDoc.location?.coordinates) {
    const [techLng, techLat] = techDoc.location.coordinates;
    nearestEtaMinutes = Math.round((haversineKm(lat, lng, techLat, techLng) / AVG_SPEED_KMH) * 60);
  }

  return {
    status: 200,
    jsonBody: {
      onTimePercent,
      areaRating,
      nearestEtaMinutes,
      dataPointCount: timedBookings,
      isLimitedData: timedBookings < LIMITED_THRESHOLD,
    },
  };
};

app.http('getConfidenceScore', {
  route: 'v1/technicians/{id}/confidence-score',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: requireCustomer(getConfidenceScoreHandler),
});
