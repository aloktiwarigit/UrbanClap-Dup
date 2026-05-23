import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireCustomer } from '../middleware/requireCustomer.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { RegisterDeviceTokenBodySchema } from '../schemas/device-token.js';
import { deviceTokenRepo } from '../cosmos/device-token-repository.js';
import type { CustomerContext } from '../types/customer.js';
import type { AdminContext } from '../types/admin.js';

// ── Customer: POST /v1/devices/register ───────────────────────────────────────

export async function customerRegisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const body = RegisterDeviceTokenBodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return { status: 400, jsonBody: { code: 'INVALID_BODY', errors: body.error.issues } };
  }
  await deviceTokenRepo.registerDeviceToken(
    customer.customerId,
    'customer',
    body.data.deviceToken,
    body.data.platform,
    body.data.appBuild,
  );
  return { status: 204 };
}

app.http('customerRegisterDevice', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/devices/register',
  handler: requireCustomer(customerRegisterDeviceHandler),
});

// ── Customer: DELETE /v1/devices/me (SEC-06: token in X-Device-Token header) ─────────────
// New wire format — token is in X-Device-Token header, not in URL path.
// The legacy /v1/devices/{deviceToken} endpoint is kept for the transition window while
// old client builds (without SEC-06 fix) are still in the wild.

export async function customerUnregisterDeviceMeHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const deviceToken = req.headers.get('x-device-token');
  if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
  await deviceTokenRepo.unregisterDeviceToken(customer.customerId, deviceToken);
  return { status: 204 };
}

app.http('customerUnregisterDeviceMe', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'v1/devices/me',
  handler: requireCustomer(customerUnregisterDeviceMeHandler),
});

// ── Customer: DELETE /v1/devices/{deviceToken} ─────────────────────────────────

export async function customerUnregisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const deviceToken = req.params['deviceToken'];
  if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
  await deviceTokenRepo.unregisterDeviceToken(customer.customerId, deviceToken);
  return { status: 204 };
}

app.http('customerUnregisterDevice', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'v1/devices/{deviceToken}',
  handler: requireCustomer(customerUnregisterDeviceHandler),
});

// ── Technician: POST /v1/technician/devices/register ─────────────────────────

export async function technicianRegisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const { uid } = await verifyTechnicianToken(req);
    const body = RegisterDeviceTokenBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return { status: 400, jsonBody: { code: 'INVALID_BODY', errors: body.error.issues } };
    }
    await deviceTokenRepo.registerDeviceToken(
      uid,
      'technician',
      body.data.deviceToken,
      body.data.platform,
      body.data.appBuild,
    );
    return { status: 204 };
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }
}

app.http('technicianRegisterDevice', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/technician/devices/register',
  handler: technicianRegisterDeviceHandler,
});

// ── Technician: DELETE /v1/technician/devices/{deviceToken} ───────────────────

export async function technicianUnregisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const { uid } = await verifyTechnicianToken(req);
    const deviceToken = req.params['deviceToken'];
    if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
    await deviceTokenRepo.unregisterDeviceToken(uid, deviceToken);
    return { status: 204 };
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }
}

app.http('technicianUnregisterDevice', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'v1/technician/devices/{deviceToken}',
  handler: technicianUnregisterDeviceHandler,
});

// ── Admin: POST /admin/v1/devices/register ─────────────────────────────────────

export async function adminRegisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const body = RegisterDeviceTokenBodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return { status: 400, jsonBody: { code: 'INVALID_BODY', errors: body.error.issues } };
  }
  await deviceTokenRepo.registerDeviceToken(
    admin.adminId,
    'admin',
    body.data.deviceToken,
    body.data.platform,
    body.data.appBuild,
  );
  return { status: 204 };
}

app.http('adminRegisterDevice', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'admin/v1/devices/register',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminRegisterDeviceHandler),
});

// ── Admin: DELETE /admin/v1/devices/{deviceToken} ──────────────────────────────

export async function adminUnregisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const deviceToken = req.params['deviceToken'];
  if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
  await deviceTokenRepo.unregisterDeviceToken(admin.adminId, deviceToken);
  return { status: 204 };
}

app.http('adminUnregisterDevice', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'admin/v1/devices/{deviceToken}',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminUnregisterDeviceHandler),
});
