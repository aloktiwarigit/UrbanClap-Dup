import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { AdminContext } from '../src/types/admin.js';
import {
  listAdminCategoriesHandler,
  getCategoryHandler,
  createCategoryHandler,
  updateCategoryHandler,
  toggleCategoryHandler,
  listAdminServicesHandler,
  getServiceHandler,
  createServiceHandler,
  updateServiceHandler,
  toggleServiceHandler,
} from '../src/functions/catalogue-admin.js';
import { catalogueAuditEntry } from '../src/services/catalogueAudit.service.js';
import { catalogueRepo } from '../src/cosmos/catalogue-repository.js';

const mockAdmin: AdminContext = { adminId: 'dev-user', role: 'super-admin', sessionId: 'test-session' };
// Shared across every commissionBps-requires-super-admin (I-4) block below — fix round 2 found
// the field unguarded on three more write paths beyond the update-category one round 1 fixed.
const opsManager: AdminContext = { adminId: 'ops-1', role: 'ops-manager', sessionId: 'test-session' };

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
      listAllCategories: vi.fn().mockResolvedValue([cat]),
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

vi.mock('../src/services/catalogueAudit.service.js', () => ({ catalogueAuditEntry: vi.fn().mockResolvedValue(undefined) }));

function makeReq(url: string, body?: unknown, params: Record<string, string> = {}, method = 'POST') {
  const req = new HttpRequest({ url, method, ...(body ? { body: { string: JSON.stringify(body) } } : {}) });
  Object.assign(req, { params });
  return req;
}

beforeEach(() => { vi.clearAllMocks(); });

describe('POST /v1/admin/catalogue/categories', () => {
  it('returns 201 with created category', async () => {
    const body = { id: 'plumbing', name: 'Plumbing', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3 };
    const res = await createCategoryHandler(makeReq('http://localhost/api/v1/admin/catalogue/categories', body), {} as never, mockAdmin);
    expect(res.status).toBe(201);
  });

  it('emits CATALOGUE_CATEGORY_CREATED audit entry on success', async () => {
    const body = { id: 'plumbing', name: 'Plumbing', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3 };
    await createCategoryHandler(makeReq('http://localhost/api/v1/admin/catalogue/categories', body), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      'dev-user', 'super-admin', 'CATALOGUE_CATEGORY_CREATED', 'category', 'plumbing', expect.any(Object),
    );
  });

  it('returns 400 on invalid body', async () => {
    const res = await createCategoryHandler(makeReq('http://localhost/api/v1/admin/catalogue/categories', { name: '' }), {} as never, mockAdmin);
    expect(res.status).toBe(400);
  });

  // Fix round 2 (I-4, third path): round 1 guarded `updateCategoryHandler` only. An ops-manager
  // who cannot set the global rate, and (after round 1) cannot update a category's commissionBps,
  // could still reach the exact outcome I-4 exists to prevent simply by *creating* a category
  // with commissionBps populated — createCategoryHandler had no field-level check at all.
  describe('commissionBps requires super-admin on create (I-4, fix round 2)', () => {
    it('super-admin can create a category with a commission override', async () => {
      const body = { id: 'plumbing', name: 'Plumbing', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3, commissionBps: 2500 };
      const res = await createCategoryHandler(makeReq('http://localhost/...', body), {} as never, mockAdmin);
      expect(res.status).toBe(201);
      expect(vi.mocked(catalogueRepo.createCategory)).toHaveBeenCalledWith(
        expect.objectContaining({ commissionBps: 2500 }), 'dev-user',
      );
    });

    it('ops-manager can create an ordinary category without commissionBps', async () => {
      const body = { id: 'plumbing', name: 'Plumbing', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3 };
      const res = await createCategoryHandler(makeReq('http://localhost/...', body), {} as never, opsManager);
      expect(res.status).toBe(201);
      expect(vi.mocked(catalogueRepo.createCategory)).toHaveBeenCalledWith(body, 'ops-1');
    });

    it('ops-manager creating a category with commissionBps gets 403 and nothing is written', async () => {
      const body = { id: 'plumbing', name: 'Plumbing', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3, commissionBps: 2500 };
      const res = await createCategoryHandler(makeReq('http://localhost/...', body), {} as never, opsManager);
      expect(res.status).toBe(403);
      expect(res.jsonBody).toMatchObject({ code: 'FORBIDDEN', field: 'commissionBps' });
      expect(vi.mocked(catalogueRepo.createCategory)).not.toHaveBeenCalled();
      expect(vi.mocked(catalogueRepo.getCategoryById)).not.toHaveBeenCalled();
    });
  });
});

describe('GET /v1/admin/catalogue/categories', () => {
  it('returns admin category list including inactive categories', async () => {
    const res = await listAdminCategoriesHandler(
      makeReq('http://localhost/api/v1/admin/catalogue/categories', undefined, {}, 'GET'),
      {} as never,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    const body = res.jsonBody as { categories: { id: string }[] };
    expect(body.categories[0]?.id).toBe('plumbing');
  });
});

describe('GET /v1/admin/catalogue/categories/{id}', () => {
  it('returns 404 when category is missing', async () => {
    const res = await getCategoryHandler(
      makeReq('http://localhost/...', undefined, { id: 'missing' }, 'GET'),
      {} as never,
      mockAdmin,
    );
    expect(res.status).toBe(404);
  });
});

describe('PUT /v1/admin/catalogue/categories/{id}', () => {
  it('returns 200 with updated category', async () => {
    const body = { name: 'Plumbing Updated', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3 };
    const res = await updateCategoryHandler(makeReq('http://localhost/...', body, { id: 'plumbing' }, 'PUT'), {} as never, mockAdmin);
    expect(res.status).toBe(200);
  });

  it('emits CATALOGUE_CATEGORY_UPDATED audit entry on success', async () => {
    const body = { name: 'Plumbing Updated', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 3 };
    await updateCategoryHandler(makeReq('http://localhost/...', body, { id: 'plumbing' }, 'PUT'), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      'dev-user', 'super-admin', 'CATALOGUE_CATEGORY_UPDATED', 'category', 'plumbing', expect.any(Object),
    );
  });

  // Fix round 1 (I-4): `requireAdmin(['super-admin', 'ops-manager'])` guards this whole route
  // (ops-managers legitimately edit name/images/activation), but `commissionBps` is a money field
  // that must be super-admin-only — the global rate PUT already is. This block pins the
  // field-level guard added to `updateCategoryHandler` directly (the shared
  // `vi.mock('../src/middleware/requireAdmin.js', ...)` above always passes `mockAdmin` through
  // regardless of the roles it was constructed with, so these tests call the handler with an
  // explicit `AdminContext` to exercise the handler's own role check, not the route-level HOF).
  describe('commissionBps requires super-admin (I-4)', () => {
    it('super-admin can set a category commission override', async () => {
      const res = await updateCategoryHandler(
        makeReq('http://localhost/...', { commissionBps: 2500 }, { id: 'plumbing' }, 'PUT'),
        {} as never,
        mockAdmin,
      );
      expect(res.status).toBe(200);
      expect(vi.mocked(catalogueRepo.updateCategory)).toHaveBeenCalledWith(
        'plumbing', { commissionBps: 2500 }, 'dev-user',
      );
    });

    it('super-admin can clear a category commission override', async () => {
      const res = await updateCategoryHandler(
        makeReq('http://localhost/...', { commissionBps: null }, { id: 'plumbing' }, 'PUT'),
        {} as never,
        mockAdmin,
      );
      expect(res.status).toBe(200);
      expect(vi.mocked(catalogueRepo.updateCategory)).toHaveBeenCalledWith(
        'plumbing', { commissionBps: null }, 'dev-user',
      );
    });

    it('ops-manager can still patch a name-only body', async () => {
      const res = await updateCategoryHandler(
        makeReq('http://localhost/...', { name: 'Plumbing Updated' }, { id: 'plumbing' }, 'PUT'),
        {} as never,
        opsManager,
      );
      expect(res.status).toBe(200);
      expect(vi.mocked(catalogueRepo.updateCategory)).toHaveBeenCalledWith(
        'plumbing', { name: 'Plumbing Updated' }, 'ops-1',
      );
    });

    it('ops-manager setting commissionBps gets 403 and the stored document is unchanged', async () => {
      vi.mocked(catalogueRepo.updateCategory).mockClear();
      const res = await updateCategoryHandler(
        makeReq('http://localhost/...', { commissionBps: 2500 }, { id: 'plumbing' }, 'PUT'),
        {} as never,
        opsManager,
      );
      expect(res.status).toBe(403);
      expect(res.jsonBody).toMatchObject({ code: 'FORBIDDEN', field: 'commissionBps' });
      expect(vi.mocked(catalogueRepo.updateCategory)).not.toHaveBeenCalled();
    });

    it('ops-manager clearing commissionBps also gets 403 and the stored document is unchanged', async () => {
      vi.mocked(catalogueRepo.updateCategory).mockClear();
      const res = await updateCategoryHandler(
        makeReq('http://localhost/...', { commissionBps: null }, { id: 'plumbing' }, 'PUT'),
        {} as never,
        opsManager,
      );
      expect(res.status).toBe(403);
      expect(vi.mocked(catalogueRepo.updateCategory)).not.toHaveBeenCalled();
    });

    it('ops-manager mixing commissionBps into an otherwise-allowed patch is still rejected wholesale', async () => {
      vi.mocked(catalogueRepo.updateCategory).mockClear();
      const res = await updateCategoryHandler(
        makeReq('http://localhost/...', { name: 'Plumbing Updated', commissionBps: 2500 }, { id: 'plumbing' }, 'PUT'),
        {} as never,
        opsManager,
      );
      expect(res.status).toBe(403);
      expect(vi.mocked(catalogueRepo.updateCategory)).not.toHaveBeenCalled();
    });
  });
});

describe('PATCH /v1/admin/catalogue/categories/{id}/toggle', () => {
  it('returns 200 with toggled isActive', async () => {
    const res = await toggleCategoryHandler(makeReq('http://localhost/...', undefined, { id: 'plumbing' }, 'PATCH'), {} as never, mockAdmin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { isActive: boolean }).isActive).toBe(false);
  });

  it('emits CATALOGUE_CATEGORY_TOGGLED audit entry on success', async () => {
    await toggleCategoryHandler(makeReq('http://localhost/...', undefined, { id: 'plumbing' }, 'PATCH'), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      'dev-user', 'super-admin', 'CATALOGUE_CATEGORY_TOGGLED', 'category', 'plumbing', expect.any(Object),
    );
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

describe('GET /v1/admin/catalogue/services/{id}', () => {
  it('returns 404 when service is missing', async () => {
    const res = await getServiceHandler(
      makeReq('http://localhost/...', undefined, { id: 'missing' }, 'GET'),
      {} as never,
      mockAdmin,
    );
    expect(res.status).toBe(404);
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

  it('emits CATALOGUE_SERVICE_CREATED audit entry on success', async () => {
    const body = {
      id: 'leak-fix', categoryId: 'plumbing', name: 'Leak Fix', shortDescription: 'Fast.',
      heroImageUrl: 'https://example.com/l.jpg', basePrice: 39900, commissionBps: 2250,
      durationMinutes: 60, includes: [], faq: [], addOns: [], photoStages: [],
    };
    await createServiceHandler(makeReq('http://localhost/...', body), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      'dev-user', 'super-admin', 'CATALOGUE_SERVICE_CREATED', 'service', 'leak-fix', expect.any(Object),
    );
  });

  // Fix round 2 (I-4, fourth path): a service-level commissionBps outranks both category and
  // global (SERVICE > CATEGORY > GLOBAL), so this is the same authorization gap one layer further
  // down the cascade, not a lesser variant of it.
  describe('commissionBps requires super-admin on create (I-4, fix round 2)', () => {
    const withoutBps = {
      id: 'leak-fix', categoryId: 'plumbing', name: 'Leak Fix', shortDescription: 'Fast.',
      heroImageUrl: 'https://example.com/l.jpg', basePrice: 39900,
      durationMinutes: 60, includes: [], faq: [], addOns: [], photoStages: [],
    };
    const withBps = { ...withoutBps, commissionBps: 2250 };

    it('super-admin can create a service with a commission override', async () => {
      const res = await createServiceHandler(makeReq('http://localhost/...', withBps), {} as never, mockAdmin);
      expect(res.status).toBe(201);
      expect(vi.mocked(catalogueRepo.createService)).toHaveBeenCalledWith(
        expect.objectContaining({ commissionBps: 2250 }), 'dev-user',
      );
    });

    it('ops-manager can create an ordinary service without commissionBps', async () => {
      const res = await createServiceHandler(makeReq('http://localhost/...', withoutBps), {} as never, opsManager);
      expect(res.status).toBe(201);
      expect(vi.mocked(catalogueRepo.createService)).toHaveBeenCalledWith(withoutBps, 'ops-1');
    });

    it('ops-manager creating a service with commissionBps gets 403 and nothing is written', async () => {
      const res = await createServiceHandler(makeReq('http://localhost/...', withBps), {} as never, opsManager);
      expect(res.status).toBe(403);
      expect(res.jsonBody).toMatchObject({ code: 'FORBIDDEN', field: 'commissionBps' });
      expect(vi.mocked(catalogueRepo.createService)).not.toHaveBeenCalled();
      expect(vi.mocked(catalogueRepo.getServiceByIdCrossPartition)).not.toHaveBeenCalled();
    });
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

  it('emits CATALOGUE_SERVICE_UPDATED audit entry on success', async () => {
    const body = {
      name: 'Leak Fix Updated', shortDescription: 'Faster.', heroImageUrl: 'https://example.com/l2.jpg',
      basePrice: 49900, commissionBps: 2250, durationMinutes: 45, includes: [], faq: [], addOns: [], photoStages: [],
    };
    await updateServiceHandler(makeReq('http://localhost/...', body, { id: 'leak-fix' }, 'PUT'), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      'dev-user', 'super-admin', 'CATALOGUE_SERVICE_UPDATED', 'service', 'leak-fix', expect.any(Object),
    );
  });

  // Fix round 2 (I-4): updateServiceHandler had no field-level check either — a service-level
  // commissionBps is a partial patch here (UpdateServiceBodySchema), so the ops-manager path
  // below only patches an unrelated field, mirroring the "ops-manager can still patch a name-only
  // body" case already covered for categories.
  describe('commissionBps requires super-admin on update (I-4, fix round 2)', () => {
    it('super-admin can update a service commission override', async () => {
      const res = await updateServiceHandler(
        makeReq('http://localhost/...', { commissionBps: 3000 }, { id: 'leak-fix' }, 'PUT'),
        {} as never,
        mockAdmin,
      );
      expect(res.status).toBe(200);
      expect(vi.mocked(catalogueRepo.updateService)).toHaveBeenCalledWith(
        'leak-fix', { commissionBps: 3000 }, 'dev-user',
      );
    });

    it('ops-manager can still patch a name-only body', async () => {
      const res = await updateServiceHandler(
        makeReq('http://localhost/...', { name: 'Leak Fix Updated' }, { id: 'leak-fix' }, 'PUT'),
        {} as never,
        opsManager,
      );
      expect(res.status).toBe(200);
      expect(vi.mocked(catalogueRepo.updateService)).toHaveBeenCalledWith(
        'leak-fix', { name: 'Leak Fix Updated' }, 'ops-1',
      );
    });

    it('ops-manager setting a service commissionBps gets 403 and the stored document is unchanged', async () => {
      const res = await updateServiceHandler(
        makeReq('http://localhost/...', { commissionBps: 3000 }, { id: 'leak-fix' }, 'PUT'),
        {} as never,
        opsManager,
      );
      expect(res.status).toBe(403);
      expect(res.jsonBody).toMatchObject({ code: 'FORBIDDEN', field: 'commissionBps' });
      expect(vi.mocked(catalogueRepo.updateService)).not.toHaveBeenCalled();
    });

    it('super-admin can clear a service commission override', async () => {
      const res = await updateServiceHandler(
        makeReq('http://localhost/...', { commissionBps: null }, { id: 'leak-fix' }, 'PUT'),
        {} as never,
        mockAdmin,
      );
      expect(res.status).toBe(200);
      expect(vi.mocked(catalogueRepo.updateService)).toHaveBeenCalledWith(
        'leak-fix', { commissionBps: null }, 'dev-user',
      );
    });

    it('ops-manager clearing a service commissionBps also gets 403 and the stored document is unchanged', async () => {
      vi.mocked(catalogueRepo.updateService).mockClear();
      const res = await updateServiceHandler(
        makeReq('http://localhost/...', { commissionBps: null }, { id: 'leak-fix' }, 'PUT'),
        {} as never,
        opsManager,
      );
      expect(res.status).toBe(403);
      expect(res.jsonBody).toMatchObject({ code: 'FORBIDDEN', field: 'commissionBps' });
      expect(vi.mocked(catalogueRepo.updateService)).not.toHaveBeenCalled();
    });
  });
});

describe('PATCH /v1/admin/catalogue/services/{id}/toggle', () => {
  it('returns 200 with toggled isActive', async () => {
    const res = await toggleServiceHandler(makeReq('http://localhost/...', undefined, { id: 'leak-fix' }, 'PATCH'), {} as never, mockAdmin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { isActive: boolean }).isActive).toBe(false);
  });

  it('emits CATALOGUE_SERVICE_TOGGLED audit entry on success', async () => {
    await toggleServiceHandler(makeReq('http://localhost/...', undefined, { id: 'leak-fix' }, 'PATCH'), {} as never, mockAdmin);
    expect(vi.mocked(catalogueAuditEntry)).toHaveBeenCalledWith(
      'dev-user', 'super-admin', 'CATALOGUE_SERVICE_TOGGLED', 'service', 'leak-fix', expect.any(Object),
    );
  });
});

// P0-3 regression: the update bodies became partial patches, which means `{}` now
// satisfies the schema. Without these guards a dropped payload or malformed JSON
// would rewrite `updatedAt` and emit a success audit entry for a request the server
// never actually read.
describe('P0-3 — update guards against empty and unreadable bodies', () => {
  function rawReq(raw: string, params: Record<string, string>) {
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/admin/catalogue/services/leak-fix',
      method: 'PUT',
      body: { string: raw },
    });
    Object.assign(req, { params });
    return req;
  }

  it('rejects an empty service patch with 400 EmptyPatch', async () => {
    const res = await updateServiceHandler(rawReq('{}', { id: 'leak-fix' }), {} as never, mockAdmin);

    expect(res.status).toBe(400);
    expect((res.jsonBody as { error: string }).error).toBe('EmptyPatch');
    expect(catalogueRepo.updateService).not.toHaveBeenCalled();
    expect(vi.mocked(catalogueAuditEntry)).not.toHaveBeenCalled();
  });

  it('rejects an empty category patch with 400 EmptyPatch', async () => {
    const res = await updateCategoryHandler(rawReq('{}', { id: 'plumbing' }), {} as never, mockAdmin);

    expect(res.status).toBe(400);
    expect((res.jsonBody as { error: string }).error).toBe('EmptyPatch');
    expect(catalogueRepo.updateCategory).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON with 400 InvalidJson rather than treating it as {}', async () => {
    const res = await updateServiceHandler(rawReq('{ not json', { id: 'leak-fix' }), {} as never, mockAdmin);

    expect(res.status).toBe(400);
    expect((res.jsonBody as { error: string }).error).toBe('InvalidJson');
    expect(catalogueRepo.updateService).not.toHaveBeenCalled();
    expect(vi.mocked(catalogueAuditEntry)).not.toHaveBeenCalled();
  });

  it('still accepts a single-field patch', async () => {
    const res = await updateServiceHandler(
      rawReq(JSON.stringify({ basePrice: 99900 }), { id: 'leak-fix' }),
      {} as never,
      mockAdmin,
    );

    expect(res.status).toBe(200);
    expect(catalogueRepo.updateService).toHaveBeenCalledWith('leak-fix', { basePrice: 99900 }, mockAdmin.adminId);
  });
});
