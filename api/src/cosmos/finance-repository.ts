import { randomUUID } from 'node:crypto';
import { getCosmosClient, DB_NAME } from './client.js';
import type { DailyPnLEntry, FinanceSummary, PayoutQueue, PayoutQueueEntry } from '../schemas/finance.js';

interface CompletedBooking {
  id: string;
  technicianId: string;
  technicianName: string;
  amount: number;
  /** Base + customer-approved add-ons. Settlement bills this, so P&L must count it. */
  finalAmount?: number;
  completedAt: string;
}

/**
 * P0-4: only used for bookings that predate BOTH ledgers. It is not a pricing
 * decision — it is the last resort when no commission was ever recorded.
 *
 * This constant previously drove EVERY row, because the query selected
 * `c.commissionBps` from the bookings container and that field is not on
 * BookingDocSchema and is never written. `b.commissionBps ?? DEFAULT` therefore
 * always took the default, silently discarding the per-service and per-category
 * overrides of the E21-S01 cascade along with the commission actually charged.
 */
const DEFAULT_COMMISSION_BPS = 2200;

/** Cosmos parameter lists are bounded; chunk id lookups rather than sending one huge array. */
const ID_CHUNK = 200;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Recorded commission per bookingId, from the authoritative ledgers.
 *
 * `commission_receivables` (cash, live) wins over `wallet_ledger` (Razorpay, dormant);
 * the two are mutually exclusive in trigger-booking-completed, and each stores one
 * document per booking, but preferring the live model makes the collision case
 * deterministic rather than order-dependent.
 */
async function queryRecordedCommission(bookingIds: string[]): Promise<Map<string, number>> {
  const recorded = new Map<string, number>();
  if (bookingIds.length === 0) return recorded;

  const db = getCosmosClient().database(DB_NAME);

  for (const ids of chunk(bookingIds, ID_CHUNK)) {
    const [ledger, receivables] = await Promise.all([
      db.container('wallet_ledger').items.query<{ bookingId: string; commissionAmount: number; payoutStatus: string }>({
        query: 'SELECT c.bookingId, c.commissionAmount, c.payoutStatus FROM c WHERE ARRAY_CONTAINS(@ids, c.bookingId)',
        parameters: [{ name: '@ids', value: ids }],
      }).fetchAll(),
      db.container('commission_receivables').items.query<{ bookingId: string; commissionDue: number }>({
        query: 'SELECT c.bookingId, c.commissionDue FROM c WHERE ARRAY_CONTAINS(@ids, c.bookingId)',
        parameters: [{ name: '@ids', value: ids }],
      }).fetchAll(),
    ]);

    for (const row of ledger.resources ?? []) {
      // A failed transfer still charged commission on the owner's books.
      if (typeof row?.commissionAmount === 'number') recorded.set(row.bookingId, row.commissionAmount);
    }
    for (const row of receivables.resources ?? []) {
      if (typeof row?.commissionDue === 'number') recorded.set(row.bookingId, row.commissionDue);
    }
  }

  return recorded;
}

/** Gross the customer was actually billed. */
function grossOf(b: CompletedBooking): number {
  return b.finalAmount ?? b.amount;
}

/** Commission as RECORDED at settlement; the default is a last resort, not a rate. */
function commissionOf(b: CompletedBooking, recorded: Map<string, number>): number {
  const actual = recorded.get(b.id);
  if (actual !== undefined) return actual;
  return Math.round((grossOf(b) * DEFAULT_COMMISSION_BPS) / 10000);
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
        query: `SELECT c.id, c.technicianId, c.technicianName, c.amount, c.finalAmount, c.completedAt
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
  const recorded = await queryRecordedCommission(bookings.map((b) => b.id));
  const byDate = new Map<string, { gross: number; commission: number }>();

  for (const b of bookings) {
    const date = b.completedAt.slice(0, 10);
    const gross = grossOf(b);
    const commission = commissionOf(b, recorded);
    const existing = byDate.get(date) ?? { gross: 0, commission: 0 };
    byDate.set(date, { gross: existing.gross + gross, commission: existing.commission + commission });
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
  const recorded = await queryRecordedCommission(bookings.map((b) => b.id));
  const byTech = new Map<string, { name: string; jobs: number; gross: number; commission: number }>();

  for (const b of bookings) {
    const existing = byTech.get(b.technicianId) ?? { name: b.technicianName, jobs: 0, gross: 0, commission: 0 };
    byTech.set(b.technicianId, {
      name: b.technicianName,
      jobs: existing.jobs + 1,
      gross: existing.gross + grossOf(b),
      commission: existing.commission + commissionOf(b, recorded),
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
