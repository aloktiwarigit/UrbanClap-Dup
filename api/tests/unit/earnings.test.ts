import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/wallet-ledger-repository.js', () => ({
  walletLedgerRepo: { getAllByTechnicianId: vi.fn(), getPendingHeldByTechnicianId: vi.fn() },
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { getEarningsHandler } from '../../src/functions/earnings.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import type { WalletLedgerEntry } from '../../src/schemas/wallet-ledger.js';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(auth?: string): HttpRequest {
  return {
    headers: { get: (h: string) => h.toLowerCase() === 'authorization' ? (auth ?? '') : null },
    params: {},
  } as unknown as HttpRequest;
}

function makeEntry(
  createdAt: string,
  techAmount: number,
  payoutStatus: 'PENDING' | 'PAID' | 'FAILED' = 'PAID',
  heldForCadence?: boolean,
): WalletLedgerEntry {
  return {
    id: 'e1', bookingId: 'bk-1', technicianId: 'tech-1', partitionKey: 'tech-1',
    bookingAmount: techAmount + 10000, completedJobCountAtSettlement: 1,
    commissionBps: 1000, commissionAmount: 1000, techAmount, payoutStatus, createdAt,
    ...(heldForCadence !== undefined ? { heldForCadence } : {}),
  };
}

// Use IST-aware today so tests pass regardless of UTC offset at run time
const today = new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' });
  vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([]);
  vi.mocked(walletLedgerRepo.getPendingHeldByTechnicianId).mockResolvedValue([]);
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
    // Use IST-aware date so handler's IST boundaries match
    const istNow = new Date(Date.now() + IST_OFFSET_MS);
    const threeDaysAgoIST = new Date(istNow.getTime() - 3 * 24 * 60 * 60 * 1000);
    const pastDate = threeDaysAgoIST.toISOString().slice(0, 10);
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

  // Skip on day 1-2 of IST month — no "same month, older" date exists to test with
  const istDayOfMonth = new Date(Date.now() + IST_OFFSET_MS).getDate();
  it.skipIf(istDayOfMonth <= 2)('aggregates month entry (same month, older) correctly', async () => {
    const istNow = new Date(Date.now() + IST_OFFSET_MS);
    const twoDaysAgoIST = new Date(istNow.getTime() - 2 * 24 * 60 * 60 * 1000);
    const pastDate = twoDaysAgoIST.toISOString().slice(0, 10);
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

  // IST boundary tests — use vi.setSystemTime to make the time deterministic

  it('#136 entry at 23:30 IST (18:00 UTC) is counted in IST today, not skipped', async () => {
    // System time: 2026-04-29T18:15:00Z = April 29 23:45 IST (today IST = "2026-04-29")
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T18:15:00.000Z'));
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeEntry('2026-04-29T18:00:00.000Z', 100000), // 23:30 IST Apr 29 = today IST
    ]);
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.today.techAmount).toBe(100000);
    expect(body.today.count).toBe(1);
    vi.useRealTimers();
  });

  it('#136 entry at 00:30 IST next day (19:00 UTC) is NOT counted in IST today', async () => {
    // System time: 2026-04-29T18:15:00Z = April 29 23:45 IST (today IST = "2026-04-29")
    // Entry at 19:00 UTC = April 30 00:30 IST = tomorrow IST, should NOT be in today
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T18:15:00.000Z'));
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeEntry('2026-04-29T19:00:00.000Z', 100000), // 00:30 IST Apr 30 = tomorrow IST
    ]);
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    expect(body.today.techAmount).toBe(0);
    expect(body.today.count).toBe(0);
    vi.useRealTimers();
  });

  describe('pendingHeld (AC-7)', () => {
    it('returns pendingHeld=0 when no held entries', async () => {
      const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
      const body = res.jsonBody as any;
      expect(body.pendingHeld).toBe(0);
    });

    it('sums techAmount of PENDING heldForCadence entries', async () => {
      vi.mocked(walletLedgerRepo.getPendingHeldByTechnicianId).mockResolvedValue([
        makeEntry(`${today}T08:00:00.000Z`, 50000, 'PENDING', true),
        makeEntry(`${today}T09:00:00.000Z`, 30000, 'PENDING', true),
      ]);
      const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
      const body = res.jsonBody as any;
      expect(body.pendingHeld).toBe(80000);
    });

    it('pendingHeld does NOT include paid or failed entries', async () => {
      vi.mocked(walletLedgerRepo.getPendingHeldByTechnicianId).mockResolvedValue([
        makeEntry(`${today}T08:00:00.000Z`, 50000, 'PENDING', true),
      ]);
      vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
        makeEntry(`${today}T09:00:00.000Z`, 70000, 'PAID'),
      ]);
      const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
      const body = res.jsonBody as any;
      expect(body.pendingHeld).toBe(50000); // only the held entry
      expect(body.today.techAmount).toBe(70000); // paid entry counted in totals
    });
  });

  it('#136 monthly goal resets at IST month boundary, not UTC midnight', async () => {
    // System time: 2026-04-30T18:45:00Z = May 1 00:15 IST — IST month is "2026-05"
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-30T18:45:00.000Z'));
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeEntry('2026-04-30T18:00:00.000Z', 80000), // 23:30 IST Apr 30 = April IST month
      makeEntry('2026-04-30T18:45:00.000Z', 20000), // 00:15 IST May 1  = May IST month
    ]);
    const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
    const body = res.jsonBody as any;
    // monthStr is "2026-05" (IST), so only the May entry counts
    expect(body.month.techAmount).toBe(20000);
    expect(body.month.count).toBe(1);
    vi.useRealTimers();
  });
});
