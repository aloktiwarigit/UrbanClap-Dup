import { describe, it, expect, vi } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { AdminContext } from '../src/types/admin.js';
import {
  createCategoryHandler,
  updateCategoryHandler,
  toggleCategoryHandler,
  listAdminServicesHandler,
  createServiceHandler,
  updateServiceHandler,
  toggleServiceHandler,
} from '../src/functions/catalogue-admin.js';
import { catalogueAuditEntry } from '../src/services/catalogueAudit.service.js';

const mockAdmin: AdminContext = { adminId: 'dev-user', role: 'super-admin', sessionId: 'test-session' };

vi.mock('../src/cosmos/catalogue-repository.js', () => {
  const NOW = '2026-04-19T00:00:00.000Z';
  const cat = { id: 'plumbing', name: 'Plumbing', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3, isActive: true, updatedBy: 'dev-user', createdAt: NOW, updatedAt: NOW };
  const svc = {
    id: 'leak-fix', categoryId: 'plumbing', name: 'Leak Fix', shortDescription: 'Fast.',
    heroImageUrl: 'https://example.com/l.jpg', basePrice: 39900, commissionBps: 2250,
    durationMinutes: 60, includes: [], faq: [], addOns: [], photoStages: [],
    isActive: true, updatedBy: 'dev-user', createdAt: NOW, updatedAt: NOW,
  };
  return {
    catalogueRepo: {
      // Existence checks: return null so create handlers return 201 (not 409)
      getCategoryById: vi.fn().mockResolvedValue(null),
      getServiceByIdCrossPartition: vi.fn().mockResolvedValue(null),
      createCategory: vi.fn().mockResolvedValue(cat),
      updateCategory: vi.fn().mockResolvedValue(cat),
      toggleCategory: vi.fn().mockResolvedValue({ ...cat, isActive: false }),
      listServicesByCategory: vi.fn().mockResolvedValue([svc]),
      listAllActiveServices: vi.fn().mockResolvedValue([svc]),
      createService: vi.fn().mockResolvedValue(svc),
      updateService: vi.fn().mockResolvedValue(svc),
      toggleService: vi.fn().mockResolvedValue({ ...svc, isActive: false }),
    },
  };
});

// Mock requireAdmin as a passthrough HOF
vi.mock('../src/middleware/requireAdmin.js', () => ({
  requireAdmin: vi.fn().mockReturnValue(
    (handler: (req: HttpRequest, ctx: never, admin: AdminContext) => Promise<unknown>) =>
      (req: HttpRequest, ctx: never) => handler(req, ctx, mockAdmin)
  ),
}));

vi.mock('../src/services/catalogueAudit.service.js', () => ({
  catalogueAuditEntry: vi.fn(),
}));

function makeReq(url: string, body?: unknown, params: Record<string, string> = {}, method = 'POST') {
  const req = new HttpRequest({ url, method, ...(body ? { body: { string: JSON.stringify(body) } } : {}) });
  Object.assign(req, { params });
  return req;
}

describe('POST /v1/admin/catalogue/categories', () => {
  it('returns 201 with created category', async () => {
    const body = { id: 'plumbing', name: 'Plumbing', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3 };
    const res = await createCategoryHandler(makeReq('http://localhost/api/v1/admin/catalogue/categories', body), {} as never, mockAdmin);
    expect(res.status).toBe(201);
  });

  it('returns 400 on invalid body', async () => {
    const res = await createCategoryHandler(makeReq('http://localhost/api/v1/admin/catalogue/categories', { name: '' }), {} as never, mockAdmin);
    expect(res.status).toBe(400);
  });
});

describe('PUT /v1/admin/catalogue/categories/{id}', () => {
  it('returns 200 with updated category', async () => {
    const body = { name: 'Plumbing Updated', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3 };
    const res = await updateCategoryHandler(makeReq('http://localhost/...', body, { id: 'plumbing' }, 'PUT'), {} as never, mockAdmin);
    expect(res.status).toBe(200);
  });
});

describe('PATCH /v1/admin/catalogue/categories/{id}/toggle', () => {
  it('returns 200 with toggled isActive', async () => {
    const res = await toggleCategoryHandler(makeReq('http://localhost/...', undefined, { id: 'plumbing' }, 'PATCH'), {} as never, mockAdmin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { isActive: boolean }).isActive).toBe(false);
  });
});

describe('GET /v1/admin/catalogue/services', () => {
  it('returns services list', async () => {
    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/catalogue/services?categoryId=plumbing', method: 'GET' });
    Object.assign(req, { params: {} });
    const res = await listAdminServicesHandler(req, {} as never, mockAdmin);
    expect(res.status).toBe(200);
    const body = res.jsonBody as { services: { id: string }[] };
    expect(body.services[0]?.id).toBe('leak-fix');
  });
});

describe('POST /v1/admin/catalogue/services', () => {
  it('returns 201 with created service', async () => {
    const body = {
      id: 'leak-fix', categoryId: 'plumbing', name: 'Leak Fix', shortDescription: 'Fast.',
      heroImageUrl: 'https://example.com/l.jpg', basePrice: 39900, commissionBps: 2250,
      durationMinutes: 60, includes: [], faq: [], addOns: [], photoStages: [],
    };
    const res = await createServiceHandler(makeReq('http://localhost/...', body), {} as never, mockAdmin);
    expect(res.status).toBe(201);
  });
});

describe('PUT /v1/admin/catalogue/services/{id}', () => {
  it('returns 200 with updated service', async () => {
    const body = {
      name: 'Leak Fix Updated', shortDescription: 'Faster.', heroImageUrl: 'https://example.com/l2.jpg',
      basePrice: 49900, commissionBps: 2250, durationMinutes: 45, includes: [], faq: [], addOns: [], photoStages: [],
    };
    const res = await updateServiceHandler(makeReq('http://localhost/...', body, { id: 'leak-fix' }, 'PUT'), {} as never, mockAdmin);
    expect(res.status).toBe(200);
  });
});

describe('PATCH /v1/admin/catalogue/services/{id}/toggle', () => {
  it('returns 200 with toggled isActive', async () => {
    const res = await toggleServiceHandler(makeReq('http://localhost/...', undefined, { id: 'leak-fix' }, 'PATCH'), {} as never, mockAdmin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { isActive: boolean }).isActive).toBe(false);
  });
});

describe('audit instrumentation — FR-9.4 catalogue mutations', () => {
  it('emits CATALOGUE_CATEGORY_CREATED on createCategoryHandler success', async () => {
    const body = { id: 'plumbing', name: 'Plumbing', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3 };
    await createCategoryHandler(makeReq('http://localhost/api/v1/admin/catalogue/categories', body), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      mockAdmin, 'CATALOGUE_CATEGORY_CREATED', 'category', 'plumbing', expect.objectContaining({ id: 'plumbing' }),
    );
  });

  it('emits CATALOGUE_CATEGORY_UPDATED on updateCategoryHandler success', async () => {
    const body = { name: 'Plumbing Updated', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3 };
    await updateCategoryHandler(makeReq('http://localhost/...', body, { id: 'plumbing' }, 'PUT'), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      mockAdmin, 'CATALOGUE_CATEGORY_UPDATED', 'category', 'plumbing', expect.objectContaining({ id: 'plumbing' }),
    );
  });

  it('emits CATALOGUE_CATEGORY_TOGGLED on toggleCategoryHandler success', async () => {
    await toggleCategoryHandler(makeReq('http://localhost/...', undefined, { id: 'plumbing' }, 'PATCH'), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      mockAdmin, 'CATALOGUE_CATEGORY_TOGGLED', 'category', 'plumbing', expect.objectContaining({ id: 'plumbing' }),
    );
  });

  it('emits CATALOGUE_SERVICE_CREATED on createServiceHandler success', async () => {
    const body = {
      id: 'leak-fix', categoryId: 'plumbing', name: 'Leak Fix', shortDescription: 'Fast.',
      heroImageUrl: 'https://example.com/l.jpg', basePrice: 39900, commissionBps: 2250,
      durationMinutes: 60, includes: [], faq: [], addOns: [], photoStages: [],
    };
    await createServiceHandler(makeReq('http://localhost/...', body), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      mockAdmin, 'CATALOGUE_SERVICE_CREATED', 'service', 'leak-fix', expect.objectContaining({ id: 'leak-fix' }),
    );
  });

  it('emits CATALOGUE_SERVICE_UPDATED on updateServiceHandler success', async () => {
    const body = {
      name: 'Leak Fix Updated', shortDescription: 'Faster.', heroImageUrl: 'https://example.com/l2.jpg',
      basePrice: 49900, commissionBps: 2250, durationMinutes: 45, includes: [], faq: [], addOns: [], photoStages: [],
    };
    await updateServiceHandler(makeReq('http://localhost/...', body, { id: 'leak-fix' }, 'PUT'), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      mockAdmin, 'CATALOGUE_SERVICE_UPDATED', 'service', 'leak-fix', expect.objectContaining({ id: 'leak-fix' }),
    );
  });

  it('emits CATALOGUE_SERVICE_TOGGLED on toggleServiceHandler success', async () => {
    await toggleServiceHandler(makeReq('http://localhost/...', undefined, { id: 'leak-fix' }, 'PATCH'), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      mockAdmin, 'CATALOGUE_SERVICE_TOGGLED', 'service', 'leak-fix', expect.objectContaining({ id: 'leak-fix' }),
    );
  });
});
