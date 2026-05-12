/**
 * E11-S02 — Pending actions read endpoints.
 *
 * GET /v1/customers/me/pending-actions
 *   Auth: requireCustomer (Firebase ID token)
 *   Returns: ACTIVE actions with expiresAt > now, sorted by priority asc
 *
 * GET /v1/technicians/me/pending-actions
 *   Auth: verifyTechnicianToken (Firebase ID token)
 *   Returns: ACTIVE actions with expiresAt > now, sorted by priority asc
 *
 * Both endpoints scope queries to the authenticated user's id — cross-user
 * access is architecturally impossible because the partition key /userId is
 * always the caller's uid.
 */

import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireCustomer, type CustomerHttpHandler } from '../middleware/requireCustomer.js';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { getActivePendingActions } from '../cosmos/pending-action-repository.js';
import { PendingActionsListResponseSchema } from '../schemas/pendingActions.js';

// ── Customer endpoint ─────────────────────────────────────────────────────────

const getCustomerPendingActionsHandler: CustomerHttpHandler = async (
  _req,
  _ctx,
  customer,
) => {
  try {
    const items = await getActivePendingActions(
      customer.customerId,
      new Date().toISOString(),
    );
    const body = PendingActionsListResponseSchema.parse({
      items,
      fetchedAt: new Date().toISOString(),
    });
    return {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
      jsonBody: body,
    };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('customerPendingActions', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/customers/me/pending-actions',
  handler: requireCustomer(getCustomerPendingActionsHandler),
});

// ── Technician endpoint ───────────────────────────────────────────────────────

const getTechnicianPendingActionsHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  try {
    const items = await getActivePendingActions(uid, new Date().toISOString());
    const body = PendingActionsListResponseSchema.parse({
      items,
      fetchedAt: new Date().toISOString(),
    });
    return {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
      jsonBody: body,
    };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('technicianPendingActions', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/technicians/me/pending-actions',
  handler: getTechnicianPendingActionsHandler,
});
