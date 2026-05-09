import '../../../bootstrap.js';
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getCosmosClient, DB_NAME } from '../../../cosmos/client.js';
import { TechLocationsResponseSchema } from '../../../schemas/dashboard.js';

interface TechnicianLocationDoc {
  id?: string;
  technicianId?: string;
  displayName?: string;
  name?: string;
  serviceType?: string;
  skills?: string[];
  lat?: number;
  lng?: number;
  location?: { coordinates?: [number, number] };
  state?: 'active' | 'enroute' | 'idle' | 'alert';
  isAvailable?: boolean;
  updatedAt?: string;
}

function toTechLocation(doc: TechnicianLocationDoc) {
  const lng = typeof doc.lng === 'number' ? doc.lng : doc.location?.coordinates?.[0];
  const lat = typeof doc.lat === 'number' ? doc.lat : doc.location?.coordinates?.[1];
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  return {
    technicianId: doc.technicianId ?? doc.id ?? 'unknown',
    ...(doc.displayName ?? doc.name ? { name: doc.displayName ?? doc.name } : {}),
    ...(doc.serviceType ?? doc.skills?.[0] ? { serviceType: doc.serviceType ?? doc.skills?.[0] } : {}),
    lat,
    lng,
    state: doc.state ?? (doc.isAvailable === false ? 'enroute' : 'active'),
    updatedAt: doc.updatedAt ?? new Date().toISOString(),
  };
}

export async function techLocationsHandler(
  _req: HttpRequest,
  ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  try {
    const db = getCosmosClient().database(DB_NAME);

    const result = await db
      .container('technicians')
      .items.query({
        query:
          'SELECT c.id, c.technicianId, c.displayName, c.name, c.serviceType, c.skills, c.lat, c.lng, c.location, c.state, c.isAvailable, c.updatedAt FROM c WHERE c.isOnline = true AND (NOT IS_DEFINED(c.suspended) OR c.suspended = false)',
        parameters: [],
      })
      .fetchAll();

    const techs = (result.resources as TechnicianLocationDoc[])
      .map(toTechLocation)
      .filter((tech): tech is NonNullable<ReturnType<typeof toTechLocation>> => tech !== null);

    return {
      status: 200,
      headers: { 'Cache-Control': 'max-age=30' },
      jsonBody: TechLocationsResponseSchema.parse({ techs }),
    };
  } catch {
    ctx.error('Cosmos error in dashboard/tech-locations');
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
}

app.http('adminDashboardTechLocations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/admin/dashboard/tech-locations',
  handler: requireAdmin(['super-admin', 'ops-manager'])(techLocationsHandler),
});
