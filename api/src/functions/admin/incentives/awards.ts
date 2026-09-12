import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { incentiveRepo } from '../../../cosmos/incentive-repository.js';
import { IST_WEEK_KEY_RE } from '../../../lib/ist-time.js';

export const listIncentiveAwardsHandler: AdminHttpHandler = async (
  req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext,
): Promise<HttpResponseInit> => {
  const week = req.query.get('week') ?? undefined;
  // Validated here, not just bound as a parameter: a malformed week is a client bug, and
  // returning an empty page for it would look like "no awards that week".
  if (week !== undefined && !IST_WEEK_KEY_RE.test(week)) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', message: 'week must be YYYY-Www' } };
  }
  const technicianId = req.query.get('technicianId') ?? undefined;
  const continuationToken = req.query.get('continuationToken') ?? undefined;
  try {
    const page = await incentiveRepo.listAwardsCrossPartition({
      ...(week !== undefined ? { weekKey: week } : {}),
      ...(technicianId !== undefined ? { technicianId } : {}),
      ...(continuationToken !== undefined ? { continuationToken } : {}),
    });
    return { status: 200, jsonBody: page };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('listIncentiveAwards', {
  methods: ['GET'], route: 'v1/admin/incentives/awards', authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(listIncentiveAwardsHandler),
});
