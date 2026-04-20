import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import '../bootstrap.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { CreateCategoryBodySchema, UpdateCategoryBodySchema } from '../schemas/service-category.js';
import { CreateServiceBodySchema, UpdateServiceBodySchema } from '../schemas/service.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import type { AdminContext } from '../types/admin.js';
import { ZodError } from 'zod';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

async function parseJson(req: HttpRequest): Promise<unknown> {
  const text = await req.text();
  try { return JSON.parse(text); } catch { return {}; }
}

function zodErr(err: ZodError): HttpResponseInit {
  return {
    status: 400,
    headers: JSON_HEADERS,
    jsonBody: { error: 'ValidationError', issues: err.issues.map(i => ({ path: i.path, message: i.message, code: i.code })) },
  };
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function createCategoryHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  try {
    const body = CreateCategoryBodySchema.parse(await parseJson(req));
    const existing = await catalogueRepo.getCategoryById(body.id);
    if (existing) return { status: 409, headers: JSON_HEADERS, jsonBody: { error: `Category '${body.id}' already exists` } };
    const created = await catalogueRepo.createCategory(body, admin.adminId);
    return { status: 201, headers: JSON_HEADERS, jsonBody: created };
  } catch (err) {
    if (err instanceof ZodError) return zodErr(err);
    throw err;
  }
}

export async function updateCategoryHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    const body = UpdateCategoryBodySchema.parse(await parseJson(req));
    const updated = await catalogueRepo.updateCategory(id, body, admin.adminId);
    if (!updated) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Category not found' } };
    return { status: 200, headers: JSON_HEADERS, jsonBody: updated };
  } catch (err) {
    if (err instanceof ZodError) return zodErr(err);
    throw err;
  }
}

export async function toggleCategoryHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  const id = req.params['id']!;
  const updated = await catalogueRepo.toggleCategory(id, admin.adminId);
  if (!updated) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Category not found' } };
  return { status: 200, headers: JSON_HEADERS, jsonBody: updated };
}

// ── Services ──────────────────────────────────────────────────────────────────

export async function listAdminServicesHandler(req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext): Promise<HttpResponseInit> {
  const categoryId = req.query.get('categoryId') ?? undefined;
  const services = categoryId
    ? await catalogueRepo.listServicesByCategory(categoryId)
    : await catalogueRepo.listAllActiveServices();
  return { status: 200, headers: JSON_HEADERS, jsonBody: { services } };
}

export async function createServiceHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  try {
    const body = CreateServiceBodySchema.parse(await parseJson(req));
    const existing = await catalogueRepo.getServiceByIdCrossPartition(body.id);
    if (existing) return { status: 409, headers: JSON_HEADERS, jsonBody: { error: `Service '${body.id}' already exists` } };
    const created = await catalogueRepo.createService(body, admin.adminId);
    return { status: 201, headers: JSON_HEADERS, jsonBody: created };
  } catch (err) {
    if (err instanceof ZodError) return zodErr(err);
    throw err;
  }
}

export async function updateServiceHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    const body = UpdateServiceBodySchema.parse(await parseJson(req));
    const updated = await catalogueRepo.updateService(id, body, admin.adminId);
    if (!updated) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Service not found' } };
    return { status: 200, headers: JSON_HEADERS, jsonBody: updated };
  } catch (err) {
    if (err instanceof ZodError) return zodErr(err);
    throw err;
  }
}

export async function toggleServiceHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  const id = req.params['id']!;
  const updated = await catalogueRepo.toggleService(id, admin.adminId);
  if (!updated) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Service not found' } };
  return { status: 200, headers: JSON_HEADERS, jsonBody: updated };
}

// ── Route registrations ───────────────────────────────────────────────────────

const adminRoles = requireAdmin(['super-admin', 'ops-manager']);

app.http('adminCreateCategory', { methods: ['POST'], route: 'v1/admin/catalogue/categories', authLevel: 'anonymous', handler: adminRoles(createCategoryHandler) });
app.http('adminUpdateCategory', { methods: ['PUT'], route: 'v1/admin/catalogue/categories/{id}', authLevel: 'anonymous', handler: adminRoles(updateCategoryHandler) });
app.http('adminToggleCategory', { methods: ['PATCH'], route: 'v1/admin/catalogue/categories/{id}/toggle', authLevel: 'anonymous', handler: adminRoles(toggleCategoryHandler) });
app.http('adminListServices', { methods: ['GET'], route: 'v1/admin/catalogue/services', authLevel: 'anonymous', handler: adminRoles(listAdminServicesHandler) });
app.http('adminCreateService', { methods: ['POST'], route: 'v1/admin/catalogue/services', authLevel: 'anonymous', handler: adminRoles(createServiceHandler) });
app.http('adminUpdateService', { methods: ['PUT'], route: 'v1/admin/catalogue/services/{id}', authLevel: 'anonymous', handler: adminRoles(updateServiceHandler) });
app.http('adminToggleService', { methods: ['PATCH'], route: 'v1/admin/catalogue/services/{id}/toggle', authLevel: 'anonymous', handler: adminRoles(toggleServiceHandler) });
