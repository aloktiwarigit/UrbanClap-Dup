import { getCommissionReceivablesContainer } from './client.js';
import type {
  CommissionReceivableEntry,
  CommissionReceivableCreateInput,
  RemittanceMethod,
} from '../schemas/commission-receivable.js';

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
      });
      return true;
    } catch (err: unknown) {
      // 409 Conflict = concurrent invocation already created this entry
      if ((err as { code?: number }).code === 409) return false;
      throw err;
    }
  },

  async markRemitted(
    bookingId: string,
    technicianId: string,
    opts: {
      remittedAmount: number;
      remittanceMethod: RemittanceMethod;
      remittanceRef: string;
      markedByAdminId: string;
    },
  ): Promise<CommissionReceivableEntry | null> {
    const { resource } = await getCommissionReceivablesContainer()
      .item(bookingId, technicianId)
      .read<CommissionReceivableEntry>();
    if (!resource) return null;
    // Idempotent: if already settled, return unchanged
    if (resource.remittanceStatus !== 'DUE') return resource;
    const updated: CommissionReceivableEntry = {
      ...resource,
      remittanceStatus: 'REMITTED',
      remittedAmount: opts.remittedAmount,
      remittanceMethod: opts.remittanceMethod,
      remittanceRef: opts.remittanceRef,
      markedByAdminId: opts.markedByAdminId,
      remittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await getCommissionReceivablesContainer()
      .item(bookingId, technicianId)
      .replace<CommissionReceivableEntry>(updated);
    return updated;
  },

  async markWaived(
    bookingId: string,
    technicianId: string,
    opts: { waivedReason: string; markedByAdminId: string },
  ): Promise<CommissionReceivableEntry | null> {
    const { resource } = await getCommissionReceivablesContainer()
      .item(bookingId, technicianId)
      .read<CommissionReceivableEntry>();
    if (!resource) return null;
    // Idempotent: if already settled, return unchanged
    if (resource.remittanceStatus !== 'DUE') return resource;
    const updated: CommissionReceivableEntry = {
      ...resource,
      remittanceStatus: 'WAIVED',
      waivedReason: opts.waivedReason,
      markedByAdminId: opts.markedByAdminId,
      updatedAt: new Date().toISOString(),
    };
    await getCommissionReceivablesContainer()
      .item(bookingId, technicianId)
      .replace<CommissionReceivableEntry>(updated);
    return updated;
  },

  async getOutstandingByTechnician(technicianId: string): Promise<CommissionReceivableEntry[]> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CommissionReceivableEntry>(
        { query: `SELECT * FROM c WHERE c.remittanceStatus = 'DUE'` },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources;
  },

  async getAllTechnicianOutstandingSummaries(): Promise<
    Array<{
      technicianId: string;
      dueCount: number;
      totalCommissionDue: number;
      oldestDueAt: string;
    }>
  > {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CommissionReceivableEntry>({
        query: `SELECT * FROM c WHERE c.remittanceStatus = 'DUE'`,
      })
      .fetchAll();

    const byTech = new Map<
      string,
      { dueCount: number; totalCommissionDue: number; oldestDueAt: string }
    >();

    for (const entry of resources) {
      const existing = byTech.get(entry.technicianId);
      if (!existing) {
        byTech.set(entry.technicianId, {
          dueCount: 1,
          totalCommissionDue: entry.commissionDue,
          oldestDueAt: entry.createdAt,
        });
      } else {
        existing.dueCount += 1;
        existing.totalCommissionDue += entry.commissionDue;
        if (entry.createdAt < existing.oldestDueAt) {
          existing.oldestDueAt = entry.createdAt;
        }
      }
    }

    return Array.from(byTech.entries()).map(([technicianId, summary]) => ({
      technicianId,
      ...summary,
    }));
  },
};
