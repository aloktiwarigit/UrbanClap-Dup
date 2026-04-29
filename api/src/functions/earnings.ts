import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import type { EarningsResponse, EarningsPeriod, DailyEarnings, WalletLedgerEntry } from '../schemas/wallet-ledger.js';

function aggregate(entries: WalletLedgerEntry[], predicate: (e: WalletLedgerEntry) => boolean): EarningsPeriod {
  const subset = entries.filter(predicate);
  return { techAmount: subset.reduce((s, e) => s + e.techAmount, 0), count: subset.length };
}

export const getEarningsHandler: HttpHandler = async (req: HttpRequest, ctx: InvocationContext) => {
  let uid: string;
  try {
    const decoded = await verifyTechnicianToken(req);
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  try {
    const entries = await walletLedgerRepo.getAllByTechnicianId(uid);
    const settled = entries.filter(e => e.payoutStatus !== 'FAILED');

    // All period boundaries are computed in IST (+05:30) because technicians work in India.
    // Entries in Cosmos are stored in UTC; we shift for date comparisons.
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const now = new Date();
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);

    const todayStr = istNow.toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);

    // Week boundary: IST midnight 6 IST days ago, expressed as a UTC Date for Cosmos comparison.
    const weekStartIst = new Date(istNow);
    weekStartIst.setUTCDate(istNow.getUTCDate() - 6);
    const weekStartIstDateStr = weekStartIst.toISOString().slice(0, 10);
    const weekStartUtc = new Date(new Date(`${weekStartIstDateStr}T00:00:00.000Z`).getTime() - IST_OFFSET_MS);

    // Helper: IST calendar date string from a UTC ISO entry timestamp.
    const toIstDateStr = (utcIso: string): string =>
      new Date(new Date(utcIso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

    const lastSevenDays: DailyEarnings[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(istNow);
      d.setUTCDate(istNow.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTotal = settled
        .filter(e => toIstDateStr(e.createdAt) === dateStr)
        .reduce((s, e) => s + e.techAmount, 0);
      lastSevenDays.push({ date: dateStr, techAmount: dayTotal });
    }

    const response: EarningsResponse = {
      today: aggregate(settled, e => toIstDateStr(e.createdAt) === todayStr),
      week:  aggregate(settled, e => new Date(e.createdAt) >= weekStartUtc),
      month: aggregate(settled, e => toIstDateStr(e.createdAt).slice(0, 7) === monthStr),
      lifetime: aggregate(settled, _ => true),
      lastSevenDays,
    };

    return { status: 200, jsonBody: response };
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.error('getEarnings failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

app.http('getEarnings', {
  route: 'v1/technicians/me/earnings',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getEarningsHandler,
});
