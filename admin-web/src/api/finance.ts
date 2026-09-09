import { apiUrl } from './base';

export interface DailyPnLEntry {
  date: string;
  grossRevenue: number;
  commission: number;
  netToOwner: number;
}

export interface FinanceSummary {
  dailyPnL: DailyPnLEntry[];
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  // Additive (task 10, E21-S03). Sourced server-side from arePayoutsEnabled(); a real response
  // always sets it, but it stays optional here too so an absent value (an older cached response,
  // a test double) fails safe as "unknown, don't hide the queue" rather than as "disabled".
  payoutsEnabled?: boolean;
}

export interface PayoutQueueEntry {
  technicianId: string;
  technicianName: string;
  completedJobsThisWeek: number;
  grossEarnings: number;
  commissionDeducted: number;
  netPayable: number;
}

export interface PayoutQueue {
  weekStart: string;
  weekEnd: string;
  entries: PayoutQueueEntry[];
  totalNetPayable: number;
}

export interface ApprovePayoutsResult {
  approved: number;
  failed: number;
  errors: Array<{ technicianId: string; reason: string }>;
}

export async function fetchFinanceSummary(from: string, to: string): Promise<FinanceSummary> {
  const res = await fetch(
    apiUrl(`/v1/admin/finance/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error(`Finance summary ${res.status}`);
  return res.json() as Promise<FinanceSummary>;
}

export async function fetchPayoutQueue(): Promise<PayoutQueue> {
  const res = await fetch(apiUrl('/v1/admin/finance/payout-queue'), { credentials: 'include' });
  if (!res.ok) throw new Error(`Payout queue ${res.status}`);
  return res.json() as Promise<PayoutQueue>;
}

export async function approveAllPayouts(): Promise<ApprovePayoutsResult> {
  const res = await fetch(apiUrl('/v1/admin/finance/payouts/approve-all'), {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Approve payouts ${res.status}`);
  return res.json() as Promise<ApprovePayoutsResult>;
}
