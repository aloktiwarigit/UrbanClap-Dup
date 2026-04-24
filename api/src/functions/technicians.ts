import { z } from 'zod';
import { type HttpHandler, type HttpRequest, type HttpResponseInit, type InvocationContext, app } from '@azure/functions';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { requireCustomer } from '../middleware/requireCustomer.js';
import { getCosmosClient, DB_NAME } from '../cosmos/client.js';
import { TechnicianDossierSchema } from '../schemas/technician-dossier.js';
import { ConfidenceScoreQuerySchema } from '../schemas/confidence-score.js';
import type { CustomerContext } from '../types/customer.js';
import '../bootstrap.js';

const PatchFcmTokenBodySchema = z.object({
  fcmToken: z.string().min(1),
});

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

app.http('patchTechnicianFcmToken', {
  route: 'v1/technicians/fcm-token',
  methods: ['PATCH'],
  handler: patchFcmTokenHandler,
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
