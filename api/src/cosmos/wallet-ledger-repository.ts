import { getWalletLedgerContainer } from './client.js';
import type { WalletLedgerEntry, WalletLedgerCreateInput } from '../schemas/wallet-ledger.js';

export const walletLedgerRepo = {
  async getByBookingId(bookingId: string, technicianId: string): Promise<WalletLedgerEntry | null> {
    const { resource } = await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .read<WalletLedgerEntry>();
    return resource ?? null;
  },

  async createPendingEntry(input: WalletLedgerCreateInput): Promise<boolean> {
    try {
      await getWalletLedgerContainer().items.create<WalletLedgerEntry>({
        id: input.bookingId,
        bookingId: input.bookingId,
        technicianId: input.technicianId,
        partitionKey: input.technicianId,
        bookingAmount: input.bookingAmount,
        completedJobCountAtSettlement: input.completedJobCountAtSettlement,
        commissionBps: input.commissionBps,
        commissionAmount: input.commissionAmount,
        techAmount: input.techAmount,
        payoutStatus: 'PENDING',
        createdAt: new Date().toISOString(),
        ...(input.payoutCadence !== undefined ? { payoutCadence: input.payoutCadence } : {}),
        ...(input.payoutFeeAmount !== undefined ? { payoutFeeAmount: input.payoutFeeAmount } : {}),
        ...(input.heldForCadence !== undefined ? { heldForCadence: input.heldForCadence } : {}),
      });
      return true;
    } catch (err: unknown) {
      // 409 Conflict = concurrent invocation already created this entry
      if ((err as { code?: number }).code === 409) return false;
      throw err;
    }
  },

  async markPaid(bookingId: string, technicianId: string, razorpayTransferId: string): Promise<void> {
    const { resource } = await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .read<WalletLedgerEntry>();
    if (!resource) throw new Error(`wallet_ledger entry not found: ${bookingId}`);
    await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .replace<WalletLedgerEntry>({
        ...resource,
        payoutStatus: 'PAID',
        razorpayTransferId,
        settledAt: new Date().toISOString(),
        heldForCadence: false,
      });
  },

  async markFailed(bookingId: string, technicianId: string, failureReason: string): Promise<void> {
    const { resource } = await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .read<WalletLedgerEntry>();
    if (!resource) throw new Error(`wallet_ledger entry not found: ${bookingId}`);
    await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .replace<WalletLedgerEntry>({
        ...resource,
        payoutStatus: 'FAILED',
        failureReason,
      });
  },

  async getPendingEntriesOlderThan(cutoffIso: string): Promise<WalletLedgerEntry[]> {
    const { resources } = await getWalletLedgerContainer()
      .items.query<WalletLedgerEntry>({
        query: `SELECT * FROM c WHERE c.payoutStatus = 'PENDING' AND c.createdAt < @cutoff`,
        parameters: [{ name: '@cutoff', value: cutoffIso }],
      })
      .fetchAll();
    return resources;
  },

  async getFailedEntries(): Promise<WalletLedgerEntry[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { resources } = await getWalletLedgerContainer()
      .items.query<WalletLedgerEntry>({
        query: `SELECT * FROM c WHERE c.payoutStatus = 'FAILED' AND c.createdAt > @cutoff`,
        parameters: [{ name: '@cutoff', value: thirtyDaysAgo }],
      })
      .fetchAll();
    return resources;
  },

  async getPendingHeldByTechnicianId(technicianId: string): Promise<WalletLedgerEntry[]> {
    const { resources } = await getWalletLedgerContainer()
      .items.query<WalletLedgerEntry>(
        {
          query: `SELECT * FROM c WHERE c.payoutStatus = 'PENDING' AND c.heldForCadence = true`,
        },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources;
  },

  async getNextDayPendingBefore(cutoffDateIst: string): Promise<WalletLedgerEntry[]> {
    const { resources } = await getWalletLedgerContainer()
      .items.query<WalletLedgerEntry>({
        query: `SELECT * FROM c
                WHERE c.payoutCadence = 'NEXT_DAY'
                  AND c.heldForCadence = true
                  AND c.payoutStatus = 'PENDING'
                  AND c.createdAt < @cutoff`,
        parameters: [{ name: '@cutoff', value: cutoffDateIst }],
      })
      .fetchAll();
    return resources;
  },

  /** Returns only PENDING and PAID entries for the given technician (FAILED excluded at query level). */
  async getAllByTechnicianId(technicianId: string): Promise<WalletLedgerEntry[]> {
    const { resources } = await getWalletLedgerContainer()
      .items.query<WalletLedgerEntry>(
        { query: `SELECT * FROM c WHERE c.payoutStatus IN ('PENDING', 'PAID')` },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources;
  },
};
