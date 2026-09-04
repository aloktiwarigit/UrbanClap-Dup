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
import { catalogueAuditEntry } from '../services/catalogueAudit.service.js';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

/**
 * P0-3: malformed JSON used to be swallowed into `{}`. That was harmless while every
 * update body had required fields (Zod rejected `{}` with a 400), but the update
 * bodies are now partial patches, so `{}` would validate — rewriting the document
 * with a fresh `updatedAt` and writing a success audit entry for a request that was
 * never readable. Distinguish "unparseable" from "empty".
 */
class InvalidJsonError extends Error {}

async function parseJson(req: HttpRequest): Promise<unknown> {
  const text = await req.text();
  if (text.trim() === '') return {};
  try { return JSON.parse(text); } catch { throw new InvalidJsonError(); }
}

function badRequest(error: string, message: string): HttpResponseInit {
  return { status: 400, headers: JSON_HEADERS, jsonBody: { error, message } };
}

/**
 * A patch with no fields is a no-op the caller almost certainly did not intend
 * (empty body, dropped payload). Rewriting `updatedAt` and emitting a CATALOGUE_*
 * audit entry for it would be misleading, so reject it.
 */
function assertNonEmptyPatch(patch: object): void {
  if (Object.keys(patch).length === 0) throw new EmptyPatchError();
}

class EmptyPatchError extends Error {}

function zodErr(err: ZodError): HttpResponseInit {
  return {
    status: 400,
    headers: JSON_HEADERS,
    jsonBody: { error: 'ValidationError', issues: err.issues.map(i => ({ path: i.path, message: i.message, code: i.code })) },
  };
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function listAdminCategoriesHandler(_req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext): Promise<HttpResponseInit> {
  const categories = await catalogueRepo.listAllCategories();
  return { status: 200, headers: JSON_HEADERS, jsonBody: { categories } };
}

export async function getCategoryHandler(req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext): Promise<HttpResponseInit> {
  const id = req.params['id']!;
  const category = await catalogueRepo.getCategoryById(id);
  if (!category) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Category not found' } };
  return { status: 200, headers: JSON_HEADERS, jsonBody: category };
}

export async function createCategoryHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  try {
    const body = CreateCategoryBodySchema.parse(await parseJson(req));
    const existing = await catalogueRepo.getCategoryById(body.id);
    if (existing) return { status: 409, headers: JSON_HEADERS, jsonBody: { error: `Category '${body.id}' already exists` } };
    const created = await catalogueRepo.createCategory(body, admin.adminId);
    await catalogueAuditEntry(admin.adminId, admin.role, 'CATALOGUE_CATEGORY_CREATED', 'category', created.id, { name: created.name });
    return { status: 201, headers: JSON_HEADERS, jsonBody: created };
  } catch (err) {
    if (err instanceof ZodError) return zodErr(err);
    if (err instanceof InvalidJsonError) return badRequest('InvalidJson', 'Request body is not valid JSON.');
    if (err instanceof EmptyPatchError) return badRequest('EmptyPatch', 'Update body must contain at least one field.');
    throw err;
  }
}

export async function updateCategoryHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    const body = UpdateCategoryBodySchema.parse(await parseJson(req));
    assertNonEmptyPatch(body);
    const updated = await catalogueRepo.updateCategory(id, body, admin.adminId);
    if (!updated) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Category not found' } };
    await catalogueAuditEntry(admin.adminId, admin.role, 'CATALOGUE_CATEGORY_UPDATED', 'category', id, { changes: body });
    return { status: 200, headers: JSON_HEADERS, jsonBody: updated };
  } catch (err) {
    if (err instanceof ZodError) return zodErr(err);
    if (err instanceof InvalidJsonError) return badRequest('InvalidJson', 'Request body is not valid JSON.');
    if (err instanceof EmptyPatchError) return badRequest('EmptyPatch', 'Update body must contain at least one field.');
    throw err;
  }
}

export async function toggleCategoryHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  const id = req.params['id']!;
  const updated = await catalogueRepo.toggleCategory(id, admin.adminId);
  if (!updated) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Category not found' } };
  await catalogueAuditEntry(admin.adminId, admin.role, 'CATALOGUE_CATEGORY_TOGGLED', 'category', id, { isActive: updated.isActive });
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

export async function getServiceHandler(req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext): Promise<HttpResponseInit> {
  const id = req.params['id']!;
  const service = await catalogueRepo.getServiceByIdCrossPartition(id);
  if (!service) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Service not found' } };
  return { status: 200, headers: JSON_HEADERS, jsonBody: service };
}

export async function createServiceHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  try {
    const body = CreateServiceBodySchema.parse(await parseJson(req));
    const existing = await catalogueRepo.getServiceByIdCrossPartition(body.id);
    if (existing) return { status: 409, headers: JSON_HEADERS, jsonBody: { error: `Service '${body.id}' already exists` } };
    const created = await catalogueRepo.createService(body, admin.adminId);
    await catalogueAuditEntry(admin.adminId, admin.role, 'CATALOGUE_SERVICE_CREATED', 'service', created.id, { name: created.name, categoryId: created.categoryId });
    return { status: 201, headers: JSON_HEADERS, jsonBody: created };
  } catch (err) {
    if (err instanceof ZodError) return zodErr(err);
    if (err instanceof InvalidJsonError) return badRequest('InvalidJson', 'Request body is not valid JSON.');
    if (err instanceof EmptyPatchError) return badRequest('EmptyPatch', 'Update body must contain at least one field.');
    throw err;
  }
}

export async function updateServiceHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    const body = UpdateServiceBodySchema.parse(await parseJson(req));
    assertNonEmptyPatch(body);
    const updated = await catalogueRepo.updateService(id, body, admin.adminId);
    if (!updated) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Service not found' } };
    await catalogueAuditEntry(admin.adminId, admin.role, 'CATALOGUE_SERVICE_UPDATED', 'service', id, { changes: body });
    return { status: 200, headers: JSON_HEADERS, jsonBody: updated };
  } catch (err) {
    if (err instanceof ZodError) return zodErr(err);
    if (err instanceof InvalidJsonError) return badRequest('InvalidJson', 'Request body is not valid JSON.');
    if (err instanceof EmptyPatchError) return badRequest('EmptyPatch', 'Update body must contain at least one field.');
    throw err;
  }
}

export async function toggleServiceHandler(req: HttpRequest, _ctx: InvocationContext, admin: AdminContext): Promise<HttpResponseInit> {
  const id = req.params['id']!;
  const updated = await catalogueRepo.toggleService(id, admin.adminId);
  if (!updated) return { status: 404, headers: JSON_HEADERS, jsonBody: { error: 'Service not found' } };
  await catalogueAuditEntry(admin.adminId, admin.role, 'CATALOGUE_SERVICE_TOGGLED', 'service', id, { isActive: updated.isActive });
  return { status: 200, headers: JSON_HEADERS, jsonBody: updated };
}

// ── Route registrations ───────────────────────────────────────────────────────

const adminRoles = requireAdmin(['super-admin', 'ops-manager']);

app.http('adminListCategories', { methods: ['GET'], route: 'v1/admin/catalogue/categories', authLevel: 'anonymous', handler: adminRoles(listAdminCategoriesHandler) });
app.http('adminGetCategory', { methods: ['GET'], route: 'v1/admin/catalogue/categories/{id}', authLevel: 'anonymous', handler: adminRoles(getCategoryHandler) });
app.http('adminCreateCategory', { methods: ['POST'], route: 'v1/admin/catalogue/categories', authLevel: 'anonymous', handler: adminRoles(createCategoryHandler) });
app.http('adminUpdateCategory', { methods: ['PUT'], route: 'v1/admin/catalogue/categories/{id}', authLevel: 'anonymous', handler: adminRoles(updateCategoryHandler) });
app.http('adminToggleCategory', { methods: ['PATCH'], route: 'v1/admin/catalogue/categories/{id}/toggle', authLevel: 'anonymous', handler: adminRoles(toggleCategoryHandler) });
app.http('adminListServices', { methods: ['GET'], route: 'v1/admin/catalogue/services', authLevel: 'anonymous', handler: adminRoles(listAdminServicesHandler) });
app.http('adminGetService', { methods: ['GET'], route: 'v1/admin/catalogue/services/{id}', authLevel: 'anonymous', handler: adminRoles(getServiceHandler) });
app.http('adminCreateService', { methods: ['POST'], route: 'v1/admin/catalogue/services', authLevel: 'anonymous', handler: adminRoles(createServiceHandler) });
app.http('adminUpdateService', { methods: ['PUT'], route: 'v1/admin/catalogue/services/{id}', authLevel: 'anonymous', handler: adminRoles(updateServiceHandler) });
app.http('adminToggleService', { methods: ['PATCH'], route: 'v1/admin/catalogue/services/{id}/toggle', authLevel: 'anonymous', handler: adminRoles(toggleServiceHandler) });
