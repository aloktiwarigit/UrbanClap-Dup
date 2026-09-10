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

/**
 * Field-level authorization guard for `commissionBps` across every catalogue create/update body
 * in this route group (E21-S03 task 9, I-4 — fix rounds 1 and 2).
 *
 * `adminRoles` below is `requireAdmin(['super-admin', 'ops-manager'])` for the whole group,
 * because ops-managers legitimately create and edit categories and services (name, images,
 * pricing, activation). But `commissionBps` is a commission-rate field that participates in the
 * SERVICE > CATEGORY > GLOBAL resolution cascade (see the doc comments on `ServiceSchema` and
 * `ServiceCategorySchema`), and the *global* default (`putAdminCommissionConfig`) is
 * `requireAdmin(['super-admin'])` only. Without this guard on every write path, an ops-manager —
 * who cannot touch the global rate — could set a category- or service-level override that
 * supersedes it, silently changing what technicians are charged for some or all bookings.
 *
 * Checked on key PRESENCE (`'commissionBps' in body`), not on its value, so setting AND clearing
 * (an explicit `null`, accepted only on the category update body) both require super-admin —
 * clearing an override is still a rate change, since the category/service then falls back to
 * inheriting whatever is beneath it in the cascade.
 *
 * Fixed field-level rather than by narrowing `adminRoles`: locking ops-managers out of all
 * catalogue work to close a rate hole would be a much worse trade than rejecting just this one
 * field from them.
 *
 * Round 1 covered `updateCategoryHandler` only, which is what the review that raised I-4 was
 * scoped to. Round 2 found the identical field unguarded on three more write paths wired to the
 * same `adminRoles` constant in this same file — `createCategoryHandler`, `createServiceHandler`,
 * and `updateServiceHandler` — so an ops-manager could reach the exact outcome I-4 exists to
 * prevent by *creating* a category/service with `commissionBps` populated, or by *updating* a
 * service's `commissionBps` directly (a service-level override outranks both category and
 * global). All four call sites now route through this one function so a fifth write path added
 * later to this file cannot go unguarded by omission.
 */
function commissionBpsForbidden(body: object, admin: AdminContext): HttpResponseInit | null {
  if ('commissionBps' in body && admin.role !== 'super-admin') {
    return {
      status: 403,
      headers: JSON_HEADERS,
      jsonBody: { code: 'FORBIDDEN', requiredRoles: ['super-admin'], field: 'commissionBps' },
    };
  }
  return null;
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
    // Fix round 2 (I-4, third path): see `commissionBpsForbidden`'s doc comment. Checked before
    // the existence lookup so nothing is read or written for a rejected request.
    const forbidden = commissionBpsForbidden(body, admin);
    if (forbidden) return forbidden;
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
    // Fix round 1 (I-4): see `commissionBpsForbidden`'s doc comment above.
    const forbidden = commissionBpsForbidden(body, admin);
    if (forbidden) return forbidden;
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
  // Issue #334: includeInactive is used only by the commission-settings override
  // roster (admin-web CommissionSettingsClient) -- every other caller of this
  // route omits the param and keeps today's active-only behavior unchanged.
  const includeInactive = req.query.get('includeInactive') === 'true';
  const services = categoryId
    ? await catalogueRepo.listServicesByCategory(categoryId)
    : includeInactive
      ? await catalogueRepo.listAllServices()
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
    // Fix round 2 (I-4, third path): see `commissionBpsForbidden`'s doc comment. A service-level
    // override outranks both category and global, so this is not a lesser case of the category
    // gap — it is the same gap one layer further down the cascade.
    const forbidden = commissionBpsForbidden(body, admin);
    if (forbidden) return forbidden;
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
    // Fix round 2 (I-4, fourth path): see `commissionBpsForbidden`'s doc comment.
    const forbidden = commissionBpsForbidden(body, admin);
    if (forbidden) return forbidden;
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
