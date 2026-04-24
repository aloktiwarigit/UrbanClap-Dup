import {
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
  app,
} from '@azure/functions';
import { requireCustomer } from '../middleware/requireCustomer.js';
import type { CustomerContext } from '../types/customer.js';
import { ConfidenceScoreQuerySchema } from '../schemas/confidence-score.js';
import { getCosmosClient, DB_NAME } from '../cosmos/client.js';

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
  // Filter by slot date (when job happened) not createdAt (when booked) — avoids excluding advance-booked recent jobs.
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
    if (!b.startedAt) continue; // exclude: no start-time data
    const [hh, mm] = (b.slotWindow.split('-')[0] ?? '').split(':').map(Number);
    const slotStart = new Date(`${b.slotDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00.000Z`);
    if (new Date(b.startedAt).getTime() - slotStart.getTime() <= LATE_MS) onTimeCount++;
    timedBookings++;
  }
  const onTimePercent = timedBookings > 0 ? Math.round((onTimeCount / timedBookings) * 100) : 0;

  let techDoc: { id: string; location?: { type: string; coordinates: [number, number] } } | undefined;
  try {
    const result = await db
      .container('technicians')
      .item(technicianId, technicianId)
      .read<{ id: string; location?: { type: string; coordinates: [number, number] } }>();
    techDoc = result.resource;
  } catch {
    return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };
  }
  if (!techDoc) {
    return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };
  }

  // areaRating: null until per-booking ratings are collected; tech global rating intentionally excluded.
  const areaRating: number | null = null;

  let nearestEtaMinutes: number | null = null;
  const hasCustomerLocation = lat !== 0.0 || lng !== 0.0;
  if (hasCustomerLocation && techDoc?.location?.coordinates) {
    const [techLng, techLat] = techDoc.location.coordinates;
    nearestEtaMinutes = Math.round((haversineKm(lat, lng, techLat, techLng) / AVG_SPEED_KMH) * 60);
  }

  return {
    status: 200,
    jsonBody: {
      onTimePercent,
      areaRating,
      nearestEtaMinutes,
      dataPointCount: bookings.length,
      isLimitedData: bookings.length < LIMITED_THRESHOLD,
    },
  };
};

app.http('getConfidenceScore', {
  route: 'v1/technicians/{id}/confidence-score',
  methods: ['GET'],
  handler: requireCustomer(getConfidenceScoreHandler),
});
