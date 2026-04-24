import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';
process.env.COSMOS_ENDPOINT = 'https://fake.documents.azure.com';
process.env.COSMOS_KEY = 'ZmFrZWtleQ==';

vi.mock('../../../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

vi.mock('../../../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn(),
}));

import { techLocationsHandler } from '../../../../src/functions/admin/dashboard/tech-locations.js';
import { getCosmosClient } from '../../../../src/cosmos/client.js';
import { touchAndGetSession } from '../../../../src/services/adminSession.service.js';
import { requireAdmin } from '../../../../src/middleware/requireAdmin.js';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext, HttpResponseInit } from '@azure/functions';
import { TechLocationsResponseSchema } from '../../../../src/schemas/dashboard.js';

const fakeCtx = { error: vi.fn() } as unknown as InvocationContext;

function makeReq(cookieHeader?: string): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/dashboard/tech-locations',
    method: 'GET',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

const fakeTechs = [
  {
    technicianId: 't-1',
    name: 'Ramesh Kumar',
    serviceType: 'plumbing',
    lat: 28.6139,
    lng: 77.209,
    state: 'active',
    updatedAt: '2026-04-19T10:00:00Z',
  },
];

describe('GET /v1/admin/dashboard/tech-locations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const wrapped = requireAdmin(['super-admin', 'ops-manager'])(techLocationsHandler);
    const res = (await wrapped(makeReq(), fakeCtx)) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 502 UPSTREAM_ERROR on Cosmos failure', async () => {
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({
        container: () => ({
          items: {
            query: vi.fn().mockReturnValue({
              fetchAll: vi.fn().mockRejectedValue(new Error('Cosmos down')),
            }),
          },
        }),
      }),
    } as any);

    const res = (await techLocationsHandler(makeReq(), fakeCtx, {
      adminId: 'u1',
      role: 'super-admin',
      sessionId: 's1',
    })) as HttpResponseInit;

    expect(res.status).toBe(502);
    expect((res.jsonBody as any).code).toBe('UPSTREAM_ERROR');
  });

  it('returns 200 with TechLocationsResponse on happy path', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);

    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({
        container: () => ({
          items: {
            query: vi.fn().mockReturnValue({
              fetchAll: vi.fn().mockResolvedValue({ resources: fakeTechs }),
            }),
          },
        }),
      }),
    } as any);

    const res = (await techLocationsHandler(makeReq(), fakeCtx, {
      adminId: 'u1',
      role: 'super-admin',
      sessionId: 's1',
    })) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(res.headers).toMatchObject({ 'Cache-Control': 'max-age=30' });

    const parsed = TechLocationsResponseSchema.safeParse(res.jsonBody);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.techs).toHaveLength(1);
      expect(parsed.data.techs[0]?.technicianId).toBe('t-1');
    }
  });

  it('response body passes TechLocationsResponseSchema validation', async () => {
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({
        container: () => ({
          items: {
            query: vi.fn().mockReturnValue({
              fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
            }),
          },
        }),
      }),
    } as any);

    const res = (await techLocationsHandler(makeReq(), fakeCtx, {
      adminId: 'u1',
      role: 'super-admin',
      sessionId: 's1',
    })) as HttpResponseInit;

    const parsed = TechLocationsResponseSchema.safeParse(res.jsonBody);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(Array.isArray(parsed.data.techs)).toBe(true);
    }
  });
});
