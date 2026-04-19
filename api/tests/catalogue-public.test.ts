import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import { getCategoriesHandler, getServiceByIdHandler } from '../src/functions/catalogue-public.js';

vi.mock('../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: {
    listActiveCategories: vi.fn().mockResolvedValue([
      { id: 'ac-repair', name: 'AC Repair', heroImageUrl: 'https://example.com/c.jpg', sortOrder: 1, isActive: true, updatedBy: 'u', createdAt: '2026-04-19T00:00:00.000Z', updatedAt: '2026-04-19T00:00:00.000Z' },
    ]),
    listAllActiveServices: vi.fn().mockResolvedValue([
      {
        id: 'ac-deep-clean', categoryId: 'ac-repair', name: 'AC Deep Clean',
        shortDescription: 'Chemical wash.', heroImageUrl: 'https://example.com/s.jpg',
        basePrice: 59900, commissionBps: 2250, durationMinutes: 90,
        includes: [], faq: [], addOns: [], photoStages: [],
        isActive: true, updatedBy: 'u', createdAt: '2026-04-19T00:00:00.000Z', updatedAt: '2026-04-19T00:00:00.000Z',
      },
    ]),
    getServiceByIdCrossPartition: vi.fn().mockImplementation(async (id: string) => {
      if (id === 'ac-deep-clean') return {
        id: 'ac-deep-clean', categoryId: 'ac-repair', name: 'AC Deep Clean',
        shortDescription: 'Chemical wash.', heroImageUrl: 'https://example.com/s.jpg',
        basePrice: 59900, commissionBps: 2250, durationMinutes: 90,
        includes: [], faq: [], addOns: [], photoStages: [],
        isActive: true, updatedBy: 'u', createdAt: '2026-04-19T00:00:00.000Z', updatedAt: '2026-04-19T00:00:00.000Z',
      };
      return null;
    }),
  },
}));

function makeReq(url: string, params: Record<string, string> = {}) {
  const req = new HttpRequest({ url, method: 'GET' });
  Object.assign(req, { params });
  return req;
}

describe('GET /v1/categories', () => {
  it('returns 200 with nested categories+services', async () => {
    const res = await getCategoriesHandler(makeReq('http://localhost:7071/api/v1/categories'), {} as never);
    expect(res.status).toBe(200);
    const body = res.jsonBody as { categories: { id: string; services: { id: string }[] }[] };
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0]?.id).toBe('ac-repair');
    expect(body.categories[0]?.services[0]?.id).toBe('ac-deep-clean');
  });

  it('sets Cache-Control public header', async () => {
    const res = await getCategoriesHandler(makeReq('http://localhost:7071/api/v1/categories'), {} as never);
    const cc = (res.headers as Record<string, string>)['Cache-Control'];
    expect(cc).toContain('public');
    expect(cc).toContain('max-age=300');
  });

  it('service card does not include commissionBps', async () => {
    const res = await getCategoriesHandler(makeReq('http://localhost:7071/api/v1/categories'), {} as never);
    const body = res.jsonBody as { categories: { services: Record<string, unknown>[] }[] };
    expect(body.categories[0]?.services[0]).not.toHaveProperty('commissionBps');
  });
});

describe('GET /v1/services/{id}', () => {
  it('returns 200 with full service detail', async () => {
    const res = await getServiceByIdHandler(makeReq('http://localhost/api/v1/services/ac-deep-clean', { id: 'ac-deep-clean' }), {} as never);
    expect(res.status).toBe(200);
    const body = res.jsonBody as { id: string };
    expect(body.id).toBe('ac-deep-clean');
  });

  it('strips commissionBps from detail response', async () => {
    const res = await getServiceByIdHandler(makeReq('http://localhost/api/v1/services/ac-deep-clean', { id: 'ac-deep-clean' }), {} as never);
    expect(res.jsonBody as Record<string, unknown>).not.toHaveProperty('commissionBps');
  });

  it('returns 404 for unknown id', async () => {
    const res = await getServiceByIdHandler(makeReq('http://localhost/api/v1/services/unknown', { id: 'unknown' }), {} as never);
    expect(res.status).toBe(404);
  });
});
