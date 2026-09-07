import type { OperationInput } from '@azure/cosmos';
import { getCommissionReceivablesContainer } from './client.js';
import {
  outstandingOf,
  type CommissionReceivableEntry,
  type CommissionReceivableCreateInput,
} from '../schemas/commission-receivable.js';
import type { RemittanceDoc, CreditDoc } from '../schemas/commission-ledger.js';
import { mergeAllocation, type OutstandingRow } from '../services/commission-allocator.service.js';

const RECEIVABLE_FILTER = `(NOT IS_DEFINED(c.docType) OR c.docType = 'RECEIVABLE')`;

export type LedgerBatchResult = { ok: true } | { ok: false; reason: 'CONFLICT' | 'PRECONDITION' };

export const commissionReceivableRepo = {
  async getByBookingId(
    bookingId: string,
    technicianId: string,
  ): Promise<CommissionReceivableEntry | null> {
    const { resource } = await getCommissionReceivablesContainer()
      .item(bookingId, technicianId)
      .read<CommissionReceivableEntry>();
    return resource ?? null;
  },

  async createDueEntry(input: CommissionReceivableCreateInput): Promise<boolean> {
    try {
      await getCommissionReceivablesContainer().items.create<CommissionReceivableEntry>({
        id: input.bookingId,
        bookingId: input.bookingId,
        technicianId: input.technicianId,
        partitionKey: input.technicianId,
        serviceId: input.serviceId,
        categoryId: input.categoryId,
        bookingAmount: input.bookingAmount,
        commissionBps: input.commissionBps,
        commissionDue: input.commissionDue,
        commissionResolvedFrom: input.commissionResolvedFrom,
        remittanceStatus: 'DUE',
        createdAt: new Date().toISOString(),
        ...(input.cashCollectedAmount !== undefined
          ? { cashCollectedAmount: input.cashCollectedAmount }
          : {}),
        ...(input.serviceName !== undefined ? { serviceName: input.serviceName } : {}),
        ...(input.slotDate !== undefined ? { slotDate: input.slotDate } : {}),
        ...(input.collectionMethod !== undefined
          ? { collectionMethod: input.collectionMethod }
          : {}),
      });
      return true;
    } catch (err: unknown) {
      // 409 Conflict = concurrent invocation already created this entry
      if ((err as { code?: number }).code === 409) return false;
      throw err;
    }
  },

  /**
   * Batch primitive: every money-moving write on this container goes through this
   * single-partition `items.batch()` call. A failed batch does NOT throw — the failing
   * op carries 409/412 and the others 424; batch-level errors (400/429) DO throw.
   */
  async runLedgerBatch(technicianId: string, ops: OperationInput[]): Promise<LedgerBatchResult> {
    let res: { result?: ReadonlyArray<{ statusCode: number }> };
    try {
      res = await getCommissionReceivablesContainer().items.batch(ops, technicianId);
    } catch (err: unknown) {
      // Defensive mapping: the SDK is documented to resolve `items.batch()` with a per-op status
      // array on a partial failure (the path handled below), but some SDK versions/transports
      // throw instead — a bare `code` (Cosmos-style) or a message embedding the HTTP status. Map
      // those the same way as the resolve-path 409/412 so a thrown conflict/precondition still
      // becomes a retryable result instead of an unhandled rejection; anything else rethrows.
      const code = (err as { code?: number }).code;
      const message = err instanceof Error ? err.message : String(err);
      if (code === 409 || /\b409\b|Conflict/i.test(message)) return { ok: false, reason: 'CONFLICT' };
      if (code === 412 || /\b412\b|Precondition/i.test(message)) return { ok: false, reason: 'PRECONDITION' };
      throw err;
    }
    const codes = (res.result ?? []).map((r) => r.statusCode);
    if (codes.every((c) => c >= 200 && c < 300)) return { ok: true };
    if (codes.includes(409)) return { ok: false, reason: 'CONFLICT' };
    if (codes.includes(412)) return { ok: false, reason: 'PRECONDITION' };
    throw new Error(`ledger batch failed: [${codes.join(',')}]`);
  },

  async getOutstandingByTechnician(technicianId: string): Promise<OutstandingRow[]> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CommissionReceivableEntry & { _etag: string }>(
        { query: `SELECT * FROM c WHERE ${RECEIVABLE_FILTER} AND c.remittanceStatus = 'DUE'` },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources.map(({ _etag, ...entry }) => ({
      entry,
      etag: _etag,
      outstandingPaise: outstandingOf(entry),
    }));
  },

  /**
   * P0-1: every RECEIVABLE for a technician, regardless of remittance status.
   * Single-partition (pk = /technicianId), so this is cheap and safe to call per
   * request. Earnings need ALL of them, not just DUE: a job whose commission was
   * later remitted or waived was still a job the technician did and got paid for.
   */
  async getAllByTechnician(technicianId: string): Promise<CommissionReceivableEntry[]> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CommissionReceivableEntry>(
        { query: `SELECT * FROM c WHERE ${RECEIVABLE_FILTER}` },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources;
  },

  async listLedger(technicianId: string): Promise<{
    receivables: CommissionReceivableEntry[];
    remittances: RemittanceDoc[];
    credits: CreditDoc[];
  }> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<Record<string, unknown>>(
        { query: 'SELECT * FROM c' },
        { partitionKey: technicianId },
      )
      .fetchAll();
    const receivables: CommissionReceivableEntry[] = [];
    const remittances: RemittanceDoc[] = [];
    const credits: CreditDoc[] = [];
    for (const d of resources) {
      const t = (d['docType'] as string | undefined) ?? 'RECEIVABLE';
      if (t === 'RECEIVABLE') receivables.push(d as unknown as CommissionReceivableEntry);
      else if (t === 'REMITTANCE') remittances.push(d as unknown as RemittanceDoc);
      else if (t === 'CREDIT') credits.push(d as unknown as CreditDoc);
    }
    return { receivables, remittances, credits };
  },

  async getRemittance(technicianId: string, id: string): Promise<RemittanceDoc | null> {
    const { resource } = await getCommissionReceivablesContainer()
      .item(id, technicianId)
      .read<RemittanceDoc>();
    return resource ?? null;
  },

  /**
   * Point read of any doc in this container (anchor, credit, receivable, ...) by id, scoped to
   * the technician partition. Used to validate a replayed anchor: a 409 on `runLedgerBatch`'s
   * Create op tells us *something* collided, not *what* — this confirms it was the anchor itself
   * (vs., e.g., the credit doc racing) before trusting the replay as idempotent.
   */
  async readLedgerDoc<T = Record<string, unknown>>(
    technicianId: string,
    id: string,
  ): Promise<T | null> {
    // Not passed as .read<T>()'s type param: T here is a caller-side cast (e.g. Record<string,
    // unknown>), not necessarily an ItemDefinition, so we take the SDK's untyped default instead.
    const { resource } = (await getCommissionReceivablesContainer().item(id, technicianId).read()) as { resource?: unknown };
    return (resource as T | undefined) ?? null;
  },

  async getOpenCredits(technicianId: string): Promise<Array<{ doc: CreditDoc; etag: string }>> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CreditDoc & { _etag: string }>(
        { query: `SELECT * FROM c WHERE c.docType = 'CREDIT' AND c.remainingPaise > 0` },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources.map(({ _etag, ...doc }) => ({ doc, etag: _etag }));
  },

  async markWaived(
    bookingId: string,
    technicianId: string,
    opts: { waivedReason: string; markedByAdminId: string },
  ): Promise<{ entry: CommissionReceivableEntry; wasApplied: boolean } | null> {
    const { resource, etag } = await getCommissionReceivablesContainer()
      .item(bookingId, technicianId)
      .read<CommissionReceivableEntry>();
    if (!resource) return null;
    if (resource.remittanceStatus !== 'DUE') return { entry: resource, wasApplied: false };
    const now = new Date().toISOString();
    const entry = mergeAllocation(
      { ...resource, waivedReason: opts.waivedReason },
      {
        id: `waive:${bookingId}`,
        source: 'WAIVER',
        refId: opts.waivedReason,
        paise: outstandingOf(resource) || 1,
        appliedAt: now,
        byId: opts.markedByAdminId,
      },
    );
    const r = await this.runLedgerBatch(technicianId, [
      { operationType: 'Replace', id: bookingId, ifMatch: etag ?? '', resourceBody: entry as never },
    ]);
    if (!r.ok) throw Object.assign(new Error(r.reason), { code: r.reason });
    return { entry, wasApplied: true };
  },

  /**
   * Cosmos cannot page a cross-partition GROUP BY aggregate with continuation tokens the way a
   * plain SELECT can (the aggregate is recomputed per page, not carried across pages), so this
   * drains the iterator fully via `hasMoreResults()` rather than exposing a `continuationToken`
   * to the caller. Safe at pilot scale (bounded number of technicians); revisit if the technician
   * roster grows large enough that a full drain becomes expensive.
   */
  async sumDueGroupedByTechnician(): Promise<
    Array<{
      technicianId: string;
      outstandingPaise: number;
      dueCount: number;
      oldestDueAt: string;
    }>
  > {
    const iterator = getCommissionReceivablesContainer().items.query<{
      technicianId: string;
      outstandingPaise: number;
      dueCount: number;
      oldestDueAt: string;
    }>(
      {
        query: `SELECT c.technicianId, SUM(c.commissionDue - (IS_DEFINED(c.remittedAmount) ? c.remittedAmount : 0)) AS outstandingPaise, COUNT(1) AS dueCount, MIN(c.createdAt) AS oldestDueAt FROM c WHERE ${RECEIVABLE_FILTER} AND c.remittanceStatus = 'DUE' GROUP BY c.technicianId`,
      },
      { maxItemCount: 100 },
    );
    const groups: Array<{
      technicianId: string;
      outstandingPaise: number;
      dueCount: number;
      oldestDueAt: string;
    }> = [];
    while (iterator.hasMoreResults()) {
      const page = await iterator.fetchNext();
      groups.push(...page.resources);
    }
    return groups;
  },
};
