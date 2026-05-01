import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/wallet-ledger-repository.js', () => ({
  walletLedgerRepo: { getAllByTechnicianId: vi.fn() },
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { getEarningsHandler } from '../../src/functions/earnings.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import type { WalletLedgerEntry } from '../../src/schemas/wallet-ledger.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(auth?: string): HttpRequest {
  return {
    headers: { get: (h: string) => h.toLowerCase() === 'authorization' ? (auth ?? '') : null },
    params: {},
  } as unknown as HttpRequest;
}

function makeEntry(createdAt: string, techAmount: number, payoutStatus: 'PENDING' | 'PAID' | 'FAILED' = 'PAID'): WalletLedgerEntry {
  return {
    id: 'e1', bookingId: 'bk-1', technicianId: 'tech-1', partitionKey: 'tech-1',
    bookingAmount: techAmount + 10000, completedJobCountAtSettlement: 1,
    commissionBps: 1000, commissionAmount: 1000, techAmount, payoutStatus, createdAt,
  };
}

const fixedNow = new Date('2026-04-15T12:00:00.000Z');
const today = fixedNow.toISOString().slice(0, 10);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(fixedNow);
  vi.resetAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' });
  vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GET /v1/technicians/me/earnings', () => {
  it('returns 401 when no Authorization header', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('No token'));
    const res = await getEarningsHandler(makeReq(), ctx) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 200 with all-zero response when no entries', async () => {
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.today.techAmount).toBe(0);
    expect(body.today.count).toBe(0);
    expect(body.lastSevenDays).toHaveLength(7);
    expect(body.lastSevenDays.every((d: any) => d.techAmount === 0)).toBe(true);
  });

  it('aggregates today entry correctly', async () => {
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeEntry(`${today}T10:00:00.000Z`, 120000),
    ]);
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.today.techAmount).toBe(120000);
    expect(body.today.count).toBe(1);
    expect(body.lifetime.techAmount).toBe(120000);
    expect(body.lifetime.count).toBe(1);
  });

  it('aggregates week entry (3 days ago) correctly', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const pastDate = threeDaysAgo.toISOString().slice(0, 10);
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeEntry(`${pastDate}T10:00:00.000Z`, 90000),
    ]);
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.today.techAmount).toBe(0);
    expect(body.week.techAmount).toBe(90000);
    expect(body.week.count).toBe(1);
    expect(body.lifetime.techAmount).toBe(90000);
  });

  it('aggregates month entry (same month, older) correctly', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const pastDate = twoDaysAgo.toISOString().slice(0, 10);
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeEntry(`${pastDate}T10:00:00.000Z`, 75000),
    ]);
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.today.techAmount).toBe(0);
    expect(body.month.techAmount).toBe(75000);
    expect(body.month.count).toBe(1);
    expect(body.lifetime.techAmount).toBe(75000);
  });

  it('excludes FAILED entries from all totals', async () => {
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeEntry(`${today}T10:00:00.000Z`, 80000, 'FAILED'),
    ]);
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.today.techAmount).toBe(0);
    expect(body.today.count).toBe(0);
    expect(body.lifetime.techAmount).toBe(0);
    expect(body.lastSevenDays[6].techAmount).toBe(0);
  });

  it('lastSevenDays is always exactly 7 entries ordered oldest-to-newest', async () => {
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeEntry(`${today}T08:00:00.000Z`, 50000),
    ]);
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.lastSevenDays).toHaveLength(7);
    expect(body.lastSevenDays[6].date).toBe(today);
    expect(body.lastSevenDays[6].techAmount).toBe(50000);
    expect(body.lastSevenDays[0].techAmount).toBe(0);
  });

  it('calls getAllByTechnicianId with the authenticated uid', async () => {
    await getEarningsHandler(makeReq('Bearer tok'), ctx);
    expect(walletLedgerRepo.getAllByTechnicianId).toHaveBeenCalledWith('tech-1');
  });

  it('returns 500 when Cosmos call fails', async () => {
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockRejectedValue(new Error('Cosmos timeout'));
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    expect(res.status).toBe(500);
    expect((res.jsonBody as any).code).toBe('INTERNAL_ERROR');
  });
});
