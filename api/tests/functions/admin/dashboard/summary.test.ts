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

import { summaryHandler } from '../../../../src/functions/admin/dashboard/summary.js';
import { getCosmosClient } from '../../../../src/cosmos/client.js';
import { touchAndGetSession } from '../../../../src/services/adminSession.service.js';
import { requireAdmin } from '../../../../src/middleware/requireAdmin.js';
import { signAccessToken } from '../../../../src/services/jwt.service.js';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext, HttpResponseInit } from '@azure/functions';
import { DashboardSummaryResponseSchema } from '../../../../src/schemas/dashboard.js';

const fakeCtx = { error: vi.fn() } as unknown as InvocationContext;

function makeReq(cookieHeader?: string): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/dashboard/summary',
    method: 'GET',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

const makeQueryMock = (value: number) => ({
  fetchAll: vi.fn().mockResolvedValue({ resources: [value] }),
});

const makeContainer = (queryValue: number) => ({
  items: { query: vi.fn().mockReturnValue(makeQueryMock(queryValue)) },
});

describe('GET /v1/admin/dashboard/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const wrapped = requireAdmin(['super-admin', 'ops-manager'])(summaryHandler);
    const res = (await wrapped(makeReq(), fakeCtx)) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 502 UPSTREAM_ERROR on Cosmos failure', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });

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

    const res = (await summaryHandler(makeReq(`hs_access=${token}`), fakeCtx, {
      adminId: 'u1',
      role: 'super-admin',
      sessionId: 's1',
    })) as HttpResponseInit;

    expect(res.status).toBe(502);
    expect((res.jsonBody as any).code).toBe('UPSTREAM_ERROR');
  });

  it('returns 200 with DashboardSummaryResponse shape on happy path', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });

    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({
        container: (name: string) => {
          const values: Record<string, number> = {
            bookings: 5,
            complaints: 2,
            technicians: 8,
          };
          // gmvToday query also hits bookings but returns paise amount
          return makeContainer(values[name] ?? 100_000);
        },
      }),
    } as any);

    const res = (await summaryHandler(makeReq(`hs_access=${token}`), fakeCtx, {
      adminId: 'u1',
      role: 'super-admin',
      sessionId: 's1',
    })) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(res.headers).toMatchObject({ 'Cache-Control': 'no-store' });

    const parsed = DashboardSummaryResponseSchema.safeParse(res.jsonBody);
    expect(parsed.success).toBe(true);
  });

  it('response body passes DashboardSummaryResponseSchema validation', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);

    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({
        container: () => makeContainer(0),
      }),
    } as any);

    const res = (await summaryHandler(makeReq(), fakeCtx, {
      adminId: 'u1',
      role: 'super-admin',
      sessionId: 's1',
    })) as HttpResponseInit;

    const parsed = DashboardSummaryResponseSchema.safeParse(res.jsonBody);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.summary).toMatchObject({
        bookingsToday: expect.any(Number),
        gmvToday: expect.any(Number),
        commissionToday: expect.any(Number),
        payoutsPending: expect.any(Number),
        complaintsOpen: expect.any(Number),
        techsOnDuty: expect.any(Number),
      });
    }
  });
});
