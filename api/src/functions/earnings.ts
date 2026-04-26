import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import type { EarningsResponse, EarningsPeriod, DailyEarnings, WalletLedgerEntry } from '../schemas/wallet-ledger.js';

function aggregate(entries: WalletLedgerEntry[], filter: (e: WalletLedgerEntry) => boolean): EarningsPeriod {
  const subset = entries.filter(filter);
  return { techAmount: subset.reduce((s, e) => s + e.techAmount, 0), count: subset.length };
}

export const getEarningsHandler: HttpHandler = async (req: HttpRequest, _ctx: InvocationContext) => {
  let uid: string;
  try {
    const decoded = await verifyTechnicianToken(req);
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  const entries = await walletLedgerRepo.getAllByTechnicianId(uid);
  const settled = entries.filter(e => e.payoutStatus !== 'FAILED');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = todayStr.slice(0, 7);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const lastSevenDays: DailyEarnings[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayTotal = settled
      .filter(e => e.createdAt.slice(0, 10) === dateStr)
      .reduce((s, e) => s + e.techAmount, 0);
    lastSevenDays.push({ date: dateStr, techAmount: dayTotal });
  }

  const response: EarningsResponse = {
    today: aggregate(settled, e => e.createdAt.slice(0, 10) === todayStr),
    week:  aggregate(settled, e => new Date(e.createdAt) >= weekStart),
    month: aggregate(settled, e => e.createdAt.startsWith(monthStr)),
    lifetime: aggregate(settled, _ => true),
    lastSevenDays,
  };

  return { status: 200, jsonBody: response };
};

app.http('getEarnings', {
  route: 'v1/technicians/me/earnings',
  methods: ['GET'],
  handler: getEarningsHandler,
});
