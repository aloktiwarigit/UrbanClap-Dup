#!/usr/bin/env tsx
// P0-1 reconciliation — read-only. Prints, per technician, what the earnings
// endpoint reported BEFORE this fix versus what it reports AFTER.
//
// Run: npx tsx scripts/reconcile-earnings-p0-1.ts
//
// Why: P0-1 changes what "earnings" means. Before the fix the endpoint summed
// wallet_ledger.techAmount, which the cash path never writes, so every technician
// in the pilot saw ₹0. After the fix it also counts commission receivables at
// bookingAmount − commissionDue. Technicians are about to see numbers appear out
// of nowhere; check them here first so the owner is not learning the totals from
// a support call.
//
// Writes nothing. Safe to run against production.

import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env['COSMOS_ENDPOINT'];
const key = process.env['COSMOS_KEY'];
const DB = process.env['COSMOS_DATABASE'] ?? 'homeservices';

if (!endpoint || !key) {
  console.error('Set COSMOS_ENDPOINT and COSMOS_KEY before running.');
  process.exit(1);
}

interface LedgerRow {
  bookingId: string;
  technicianId: string;
  techAmount: number;
  payoutStatus: string;
}

interface ReceivableRow {
  bookingId: string;
  technicianId: string;
  bookingAmount: number;
  cashCollectedAmount?: number;
  commissionDue: number;
  remittanceStatus: string;
}

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function main(): Promise<void> {
  const client = new CosmosClient({ endpoint: endpoint!, key: key! });
  const db = client.database(DB);

  // Cross-partition, but this is a one-off operator script, not a request path.
  const [{ resources: ledger }, { resources: receivables }] = await Promise.all([
    db.container('wallet_ledger').items.query<LedgerRow>('SELECT * FROM c').fetchAll(),
    db.container('commission_receivables').items.query<ReceivableRow>('SELECT * FROM c').fetchAll(),
  ]);

  const techIds = new Set<string>([
    ...ledger.map((r) => r.technicianId),
    ...receivables.map((r) => r.technicianId),
  ]);

  console.log(`\nP0-1 earnings reconciliation — ${techIds.size} technician(s)`);
  console.log(`wallet_ledger rows: ${ledger.length}   commission_receivables rows: ${receivables.length}\n`);

  const rows: Array<{ tech: string; before: number; after: number; jobs: number }> = [];

  for (const tech of techIds) {
    // BEFORE: wallet_ledger only, FAILED excluded — the old implementation.
    const before = ledger
      .filter((r) => r.technicianId === tech && r.payoutStatus !== 'FAILED')
      .reduce((sum, r) => sum + r.techAmount, 0);

    // AFTER: union of both, deduped by bookingId, commission taken as charged.
    const byBooking = new Map<string, number>();
    for (const r of ledger) {
      if (r.technicianId !== tech || r.payoutStatus === 'FAILED') continue;
      byBooking.set(r.bookingId, r.techAmount);
    }
    for (const r of receivables) {
      if (r.technicianId !== tech) continue;
      const collected = r.cashCollectedAmount ?? r.bookingAmount;
      byBooking.set(r.bookingId, Math.max(0, collected - r.commissionDue));
    }
    const after = [...byBooking.values()].reduce((sum, v) => sum + v, 0);

    rows.push({ tech, before, after, jobs: byBooking.size });
  }

  rows.sort((a, b) => b.after - a.after);

  console.log('technicianId'.padEnd(30) + 'jobs'.padStart(6) + 'before'.padStart(16) + 'after'.padStart(16) + 'delta'.padStart(16));
  console.log('-'.repeat(84));
  for (const r of rows) {
    console.log(
      r.tech.padEnd(30) +
        String(r.jobs).padStart(6) +
        rupees(r.before).padStart(16) +
        rupees(r.after).padStart(16) +
        rupees(r.after - r.before).padStart(16),
    );
  }

  const totalBefore = rows.reduce((s, r) => s + r.before, 0);
  const totalAfter = rows.reduce((s, r) => s + r.after, 0);
  console.log('-'.repeat(84));
  console.log(
    'TOTAL'.padEnd(36) + rupees(totalBefore).padStart(16) + rupees(totalAfter).padStart(16) + rupees(totalAfter - totalBefore).padStart(16),
  );

  // Sanity checks worth seeing before this ships.
  const negatives = receivables.filter((r) => (r.cashCollectedAmount ?? r.bookingAmount) - r.commissionDue < 0);
  if (negatives.length > 0) {
    console.log(`\n⚠  ${negatives.length} receivable(s) where commissionDue exceeds bookingAmount:`);
    for (const r of negatives.slice(0, 20)) {
      console.log(`   ${r.bookingId}  amount=${rupees(r.bookingAmount)}  commission=${rupees(r.commissionDue)}`);
    }
  }

  const overlap = receivables.filter((r) => ledger.some((l) => l.bookingId === r.bookingId));
  if (overlap.length > 0) {
    console.log(`\n⚠  ${overlap.length} booking(s) present in BOTH ledgers (counted once, cash model wins):`);
    for (const r of overlap.slice(0, 20)) console.log(`   ${r.bookingId}`);
  }

  console.log('');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
