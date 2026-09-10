import { getCommissionReceivablesContainer } from './client.js';
import { istDateStr, IST_OFFSET_MS } from '../lib/ist-time.js';
import type { IncentiveAwardDoc } from '../schemas/incentive.js';

const AWARD_FILTER = `c.docType = 'INCENTIVE_AWARD'`;
const DEFAULT_PAGE_SIZE = 50;

export const incentiveRepo = {
  /** Single-partition (pk = /technicianId): cheap and safe per request. Newest week first. */
  async listAwards(technicianId: string): Promise<IncentiveAwardDoc[]> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<IncentiveAwardDoc>(
        { query: `SELECT * FROM c WHERE ${AWARD_FILTER} ORDER BY c.computedAt DESC` },
        { partitionKey: technicianId },
      ).fetchAll();
    return resources ?? [];
  },

  /** The reconciler's conditional Replace needs the etag, which a plain point read discards. */
  async getAwardWithEtag(
    technicianId: string, awardId: string,
  ): Promise<{ doc: IncentiveAwardDoc; etag: string } | null> {
    const { resource, etag } = await getCommissionReceivablesContainer()
      .item(awardId, technicianId).read<IncentiveAwardDoc>();
    return resource ? { doc: resource, etag: etag ?? '' } : null;
  },

  // SEMGREP-JUSTIFIED: cross-partition by design — the admin-wide award listing. Sole callers
  // are requireAdmin handlers; both filters are bound as query parameters and never reach the
  // query text.
  async listAwardsCrossPartition(opts: {
    weekKey?: string; technicianId?: string; continuationToken?: string; maxItemCount?: number;
  }): Promise<{ awards: IncentiveAwardDoc[]; continuationToken?: string }> {
    const where: string[] = [AWARD_FILTER];
    const parameters: Array<{ name: string; value: string }> = [];
    if (opts.weekKey !== undefined) {
      where.push('c.weekKey = @weekKey');
      parameters.push({ name: '@weekKey', value: opts.weekKey });
    }
    if (opts.technicianId !== undefined) {
      where.push('c.technicianId = @technicianId');
      parameters.push({ name: '@technicianId', value: opts.technicianId });
    }
    const iterator = getCommissionReceivablesContainer().items.query<IncentiveAwardDoc>(
      { query: `SELECT * FROM c WHERE ${where.join(' AND ')} ORDER BY c.computedAt DESC`, parameters },
      {
        maxItemCount: opts.maxItemCount ?? DEFAULT_PAGE_SIZE,
        ...(opts.continuationToken !== undefined ? { continuationToken: opts.continuationToken } : {}),
      },
    );
    // NOT an aggregate, so one fetchNext is a real page and the continuation token is meaningful
    // — unlike sumDueGroupedByTechnician, which must be drained in full.
    if (!iterator.hasMoreResults()) return { awards: [] };
    const page = await iterator.fetchNext();
    return {
      awards: page.resources ?? [],
      ...(page.continuationToken !== undefined ? { continuationToken: page.continuationToken } : {}),
    };
  },

  // SEMGREP-JUSTIFIED: cross-partition by design — the platform-wide incentive cost line on the
  // owner P&L. Sole caller is getDailyPnL, behind requireAdmin; both bounds are server-derived
  // from a validated YYYY-MM-DD range and bound as query parameters.
  /**
   * `appliedPaise` per IST calendar day, keyed on the award's `computedAt`.
   *
   * Deliberate asymmetry with the rest of `getDailyPnL`, which buckets bookings by the UTC day
   * of `completedAt`: spec §7.8 asks for the incentive line in IST days, and re-bucketing
   * bookings to match is out of scope — it would silently move every historical number on the
   * owner's P&L. Recorded in ADR-0035 as an accepted seam.
   */
  async sumAppliedByIstDay(fromIstDate: string, toIstDate: string): Promise<Map<string, number>> {
    const fromUtc = new Date(new Date(`${fromIstDate}T00:00:00.000Z`).getTime() - IST_OFFSET_MS).toISOString();
    const toUtc = new Date(new Date(`${toIstDate}T23:59:59.999Z`).getTime() - IST_OFFSET_MS).toISOString();
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<{ appliedPaise: number; computedAt: string }>({
        query: `SELECT c.appliedPaise, c.computedAt FROM c WHERE ${AWARD_FILTER} AND c.computedAt >= @from AND c.computedAt <= @to`,
        parameters: [{ name: '@from', value: fromUtc }, { name: '@to', value: toUtc }],
      }).fetchAll();
    const byDay = new Map<string, number>();
    for (const r of resources ?? []) {
      // A malformed row must never turn the owner's netToOwner into NaN.
      if (typeof r?.appliedPaise !== 'number' || typeof r?.computedAt !== 'string') continue;
      const day = istDateStr(new Date(r.computedAt));
      byDay.set(day, (byDay.get(day) ?? 0) + r.appliedPaise);
    }
    return byDay;
  },
};
