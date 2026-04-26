import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../src/cosmos/wallet-ledger-repository.js', () => ({
  walletLedgerRepo: { getAllByTechnicianId: vi.fn() },
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { getEarningsHandler } from '../../src/functions/earnings.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
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

const today = new Date().toISOString().slice(0, 10);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'tech-1' } as any);
  vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([]);
});

describe('GET /v1/technicians/me/earnings', () => {
  it('returns 401 when no Authorization header', async () => {
    vi.mocked(verifyFirebaseIdToken).mockRejectedValue(new Error('No token'));
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
});
