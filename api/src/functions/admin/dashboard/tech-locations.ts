import '../../../bootstrap.js';
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getCosmosClient, DB_NAME } from '../../../cosmos/client.js';
import { TechLocationsResponseSchema } from '../../../schemas/dashboard.js';

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
          'SELECT c.technicianId, c.name, c.serviceType, c.lat, c.lng, c.state, c.updatedAt FROM c WHERE c.isOnDuty = true',
        parameters: [],
      })
      .fetchAll();

    const techs = result.resources;

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
