import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../src/cosmos/rating-repository.js', () => ({
  ratingRepo: { getAllByTechnicianId: vi.fn() },
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { getTechRatingsHandler } from '../../src/functions/tech-ratings.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { ratingRepo } from '../../src/cosmos/rating-repository.js';
import type { RatingDoc } from '../../src/schemas/rating.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(auth?: string): HttpRequest {
  return {
    headers: { get: (h: string) => h.toLowerCase() === 'authorization' ? (auth ?? '') : null },
    params: {},
  } as unknown as HttpRequest;
}

function makeRatingDoc(overrides: Partial<RatingDoc> = {}): RatingDoc {
  return {
    id: 'r1',
    bookingId: 'bk-1',
    customerId: 'cust-1',
    technicianId: 'tech-1',
    customerOverall: 4,
    customerSubScores: { punctuality: 5, skill: 4, behaviour: 3 },
    customerComment: 'Good work',
    customerSubmittedAt: '2026-04-21T10:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'tech-1' } as any);
  vi.mocked(ratingRepo.getAllByTechnicianId).mockResolvedValue([]);
});

describe('GET /v1/technicians/me/ratings', () => {
  it('returns 401 when no Authorization header', async () => {
    vi.mocked(verifyFirebaseIdToken).mockRejectedValue(new Error('No token'));
    const res = await getTechRatingsHandler(makeReq(), ctx) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 200 with empty summary when no ratings', async () => {
    const res = await getTechRatingsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.totalCount).toBe(0);
    expect(body.averageOverall).toBe(0);
    expect(body.items).toHaveLength(0);
    expect(body.trend).toHaveLength(0);
  });

  it('returns correct averages for 3 ratings', async () => {
    vi.mocked(ratingRepo.getAllByTechnicianId).mockResolvedValue([
      makeRatingDoc({ customerOverall: 5, customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 }, customerSubmittedAt: '2026-04-21T10:00:00Z' }),
      makeRatingDoc({ bookingId: 'bk-2', customerOverall: 4, customerSubScores: { punctuality: 4, skill: 4, behaviour: 4 }, customerSubmittedAt: '2026-04-22T10:00:00Z' }),
      makeRatingDoc({ bookingId: 'bk-3', customerOverall: 3, customerSubScores: { punctuality: 3, skill: 3, behaviour: 3 }, customerSubmittedAt: '2026-04-23T10:00:00Z' }),
    ]);
    const res = await getTechRatingsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.totalCount).toBe(3);
    expect(body.averageOverall).toBe(4.0);
    expect(body.averageSubScores.punctuality).toBe(4.0);
    expect(body.averageSubScores.skill).toBe(4.0);
    expect(body.averageSubScores.behaviour).toBe(4.0);
  });

  it('returns items sorted newest-first', async () => {
    vi.mocked(ratingRepo.getAllByTechnicianId).mockResolvedValue([
      makeRatingDoc({ bookingId: 'bk-old', customerSubmittedAt: '2026-04-14T10:00:00Z' }),
      makeRatingDoc({ bookingId: 'bk-new', customerSubmittedAt: '2026-04-21T10:00:00Z' }),
    ]);
    const res = await getTechRatingsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.items[0].bookingId).toBe('bk-new');
    expect(body.items[1].bookingId).toBe('bk-old');
  });

  it('includes appealDisputed=true on items with customerAppealDisputed set', async () => {
    vi.mocked(ratingRepo.getAllByTechnicianId).mockResolvedValue([
      makeRatingDoc({ bookingId: 'bk-disputed', customerOverall: 2, customerAppealDisputed: true }),
      makeRatingDoc({ bookingId: 'bk-normal' }),
    ]);
    const res = await getTechRatingsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    const disputed = body.items.find((i: any) => i.bookingId === 'bk-disputed');
    const normal = body.items.find((i: any) => i.bookingId === 'bk-normal');
    expect(disputed?.appealDisputed).toBe(true);
    expect(normal?.appealDisputed).toBeUndefined();
  });

  it('excludes ratings with customerAppealRemoved=true from summary', async () => {
    vi.mocked(ratingRepo.getAllByTechnicianId).mockResolvedValue([
      makeRatingDoc({ bookingId: 'bk-removed', customerOverall: 1, customerAppealRemoved: true }),
      makeRatingDoc({ bookingId: 'bk-visible', customerOverall: 5 }),
    ]);
    const res = await getTechRatingsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.totalCount).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].bookingId).toBe('bk-visible');
  });

  it('trend groups ratings by ISO week Monday', async () => {
    const recent = new Date();
    recent.setUTCDate(recent.getUTCDate() - 2);
    const recentIso = recent.toISOString();
    const dow = (recent.getUTCDay() + 6) % 7;
    const monday = new Date(recent);
    monday.setUTCDate(recent.getUTCDate() - dow);
    const expectedWeekStart = monday.toISOString().slice(0, 10);

    vi.mocked(ratingRepo.getAllByTechnicianId).mockResolvedValue([
      makeRatingDoc({ bookingId: 'bk-1', customerOverall: 5, customerSubmittedAt: recentIso }),
      makeRatingDoc({ bookingId: 'bk-2', customerOverall: 3, customerSubmittedAt: recentIso }),
    ]);
    const res = await getTechRatingsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.trend.length).toBeGreaterThan(0);
    const week = body.trend[0];
    expect(week.count).toBe(2);
    expect(week.average).toBe(4.0);
    expect(week.weekStart).toBe(expectedWeekStart);
  });
});
