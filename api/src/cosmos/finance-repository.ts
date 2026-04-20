import { randomUUID } from 'node:crypto';
import { getCosmosClient, DB_NAME } from './client.js';
import type { DailyPnLEntry, FinanceSummary, PayoutQueue, PayoutQueueEntry } from '../schemas/finance.js';

interface CompletedBooking {
  id: string;
  technicianId: string;
  technicianName: string;
  amount: number;
  commissionBps?: number;
  completedAt: string;
}

interface LedgerTransferDoc {
  id: string;
  type: 'TRANSFER';
  technicianId: string;
  weekStart: string;
  razorpayTransferId: string;
  amount: number;
  createdAt: string;
}

export interface LedgerEntryInput {
  technicianId: string;
  amount: number;
  type: 'EARNING' | 'TRANSFER';
  weekStart?: string;
  razorpayTransferId?: string;
  bookingId?: string;
}

async function queryCompletedBookings(from: string, to: string): Promise<CompletedBooking[]> {
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container('bookings')
    .items.query(
      {
        query: `SELECT c.id, c.technicianId, c.technicianName, c.amount, c.commissionBps, c.completedAt
                FROM c
                WHERE c.status = 'COMPLETED'
                  AND c.completedAt >= @from
                  AND c.completedAt <= @toEnd`,
        parameters: [
          { name: '@from', value: `${from}T00:00:00.000Z` },
          { name: '@toEnd', value: `${to}T23:59:59.999Z` },
        ],
      },
    )
    .fetchAll();
  return (resources ?? []) as CompletedBooking[];
}

export async function getDailyPnL(from: string, to: string): Promise<FinanceSummary> {
  const bookings = await queryCompletedBookings(from, to);
  const byDate = new Map<string, { gross: number; commission: number }>();

  for (const b of bookings) {
    const date = b.completedAt.slice(0, 10);
    const bps = b.commissionBps ?? 0;
    const commission = Math.round(b.amount * bps / 10000);
    const existing = byDate.get(date) ?? { gross: 0, commission: 0 };
    byDate.set(date, { gross: existing.gross + b.amount, commission: existing.commission + commission });
  }

  const dailyPnL: DailyPnLEntry[] = [];
  let totalGross = 0;
  let totalCommission = 0;

  for (const [date, { gross, commission }] of [...byDate.entries()].sort()) {
    dailyPnL.push({ date, grossRevenue: gross, commission, netToOwner: gross - commission });
    totalGross += gross;
    totalCommission += commission;
  }

  return { dailyPnL, totalGross, totalCommission, totalNet: totalGross - totalCommission };
}

export async function getPayoutQueue(weekStart: string, weekEnd: string): Promise<PayoutQueue> {
  const bookings = await queryCompletedBookings(weekStart, weekEnd);
  const byTech = new Map<string, { name: string; jobs: number; gross: number; commission: number }>();

  for (const b of bookings) {
    const bps = b.commissionBps ?? 0;
    const commission = Math.round(b.amount * bps / 10000);
    const existing = byTech.get(b.technicianId) ?? { name: b.technicianName, jobs: 0, gross: 0, commission: 0 };
    byTech.set(b.technicianId, {
      name: b.technicianName,
      jobs: existing.jobs + 1,
      gross: existing.gross + b.amount,
      commission: existing.commission + commission,
    });
  }

  const entries: PayoutQueueEntry[] = [];
  let totalNetPayable = 0;

  for (const [technicianId, { name, jobs, gross, commission }] of byTech.entries()) {
    const netPayable = gross - commission;
    if (netPayable <= 0) continue;
    entries.push({ technicianId, technicianName: name, completedJobsThisWeek: jobs, grossEarnings: gross, commissionDeducted: commission, netPayable });
    totalNetPayable += netPayable;
  }

  return { weekStart, weekEnd, entries, totalNetPayable };
}

export async function getLedgerTransfer(technicianId: string, weekStart: string): Promise<LedgerTransferDoc | null> {
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container('wallet_ledger')
    .items.query(
      {
        query: `SELECT TOP 1 * FROM c WHERE c.technicianId = @tid AND c.weekStart = @ws AND c.type = 'TRANSFER'`,
        parameters: [
          { name: '@tid', value: technicianId },
          { name: '@ws', value: weekStart },
        ],
      },
    )
    .fetchAll();
  return (resources?.[0] as LedgerTransferDoc | undefined) ?? null;
}

export async function writeLedgerEntry(entry: LedgerEntryInput): Promise<void> {
  await getCosmosClient()
    .database(DB_NAME)
    .container('wallet_ledger')
    .items.create({
      id: randomUUID(),
      partitionKey: entry.technicianId,
      createdAt: new Date().toISOString(),
      ...entry,
    });
}

interface TechnicianDoc {
  id: string;
  razorpayLinkedAccountId?: string;
}

export async function getTechnicianLinkedAccount(technicianId: string): Promise<string | null> {
  const { resource } = await getCosmosClient()
    .database(DB_NAME)
    .container('technicians')
    .item(technicianId, technicianId)
    .read<TechnicianDoc>();
  return resource?.razorpayLinkedAccountId ?? null;
}

interface SnapshotDoc {
  weekStart: string;
  weekEnd: string;
  entries: PayoutQueueEntry[];
  totalNetPayable: number;
  computedAt: string;
}

export async function getWeekSnapshot(weekStart: string): Promise<PayoutQueue | null> {
  const { resource } = await getCosmosClient()
    .database(DB_NAME)
    .container('payout_snapshots')
    .item(weekStart, weekStart)
    .read<SnapshotDoc>();
  if (!resource) return null;
  return {
    weekStart: resource.weekStart,
    weekEnd: resource.weekEnd,
    entries: resource.entries,
    totalNetPayable: resource.totalNetPayable,
  };
}

export async function upsertWeekSnapshot(queue: PayoutQueue): Promise<void> {
  await getCosmosClient()
    .database(DB_NAME)
    .container('payout_snapshots')
    .items.upsert({
      id: queue.weekStart,
      partitionKey: queue.weekStart,
      computedAt: new Date().toISOString(),
      ...queue,
    });
}
