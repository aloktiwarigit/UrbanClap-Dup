const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

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

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function fetchFinanceSummary(from: string, to: string): Promise<FinanceSummary> {
  const res = await fetch(
    `${API_BASE}/api/v1/admin/finance/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error(`Finance summary ${res.status}`);
  return res.json() as Promise<FinanceSummary>;
}

export async function fetchPayoutQueue(): Promise<PayoutQueue> {
  const res = await fetch(`${API_BASE}/api/v1/admin/finance/payout-queue`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Payout queue ${res.status}`);
  return res.json() as Promise<PayoutQueue>;
}

export async function approveAllPayouts(): Promise<ApprovePayoutsResult> {
  const res = await fetch(`${API_BASE}/api/v1/admin/finance/payouts/approve-all`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Approve payouts ${res.status}`);
  return res.json() as Promise<ApprovePayoutsResult>;
}
