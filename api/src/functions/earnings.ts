import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { buildEarningEvents, toIstDateStr, IST_OFFSET_MS, type EarningEvent } from '../services/earnings.service.js';
import type { EarningsResponse, EarningsPeriod, DailyEarnings } from '../schemas/wallet-ledger.js';

const MONTH_GOAL_PAISE = 3_500_000;

function aggregate(events: EarningEvent[], predicate: (e: EarningEvent) => boolean): EarningsPeriod {
  const subset = events.filter(predicate);
  return { amountPaise: subset.reduce((s, e) => s + e.netPaise, 0), jobs: subset.length };
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
    const [entries, heldEntries, receivables] = await Promise.all([
      walletLedgerRepo.getAllByTechnicianId(uid),
      walletLedgerRepo.getPendingHeldByTechnicianId(uid),
      commissionReceivableRepo.getAllByTechnician(uid),
    ]);
    const pendingHeld = heldEntries.reduce((s, e) => s + e.techAmount, 0);

    const settled: EarningEvent[] = buildEarningEvents(entries, receivables);

    // All period boundaries are computed in IST (+05:30) because technicians work in India.
    // Entries in Cosmos are stored in UTC; we shift for date comparisons.
    const now = new Date();
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);

    const todayStr = istNow.toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);

    // Week boundary: IST midnight 6 IST days ago, expressed as a UTC Date for Cosmos comparison.
    const weekStartIst = new Date(istNow);
    weekStartIst.setUTCDate(istNow.getUTCDate() - 6);
    const weekStartIstDateStr = weekStartIst.toISOString().slice(0, 10);
    const weekStartUtc = new Date(new Date(`${weekStartIstDateStr}T00:00:00.000Z`).getTime() - IST_OFFSET_MS);

    const dailyLast7: DailyEarnings[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(istNow);
      d.setUTCDate(istNow.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayEntries = settled.filter(e => toIstDateStr(e.createdAt) === dateStr);
      dailyLast7.push({
        date: dateStr,
        amountPaise: dayEntries.reduce((s, e) => s + e.netPaise, 0),
        jobs: dayEntries.length,
      });
    }

    const monthPeriod = aggregate(settled, e => toIstDateStr(e.createdAt).slice(0, 7) === monthStr);
    const response: EarningsResponse = {
      today: aggregate(settled, e => toIstDateStr(e.createdAt) === todayStr),
      week:  aggregate(settled, e => new Date(e.createdAt) >= weekStartUtc),
      month: { ...monthPeriod, goalPaise: MONTH_GOAL_PAISE },
      lifetime: aggregate(settled, _ => true),
      dailyLast7,
      pendingHeld,
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
