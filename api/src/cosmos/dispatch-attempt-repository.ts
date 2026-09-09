import type { Resource } from '@azure/cosmos';
import { getDispatchAttemptsContainer } from './client.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';

export const dispatchAttemptRepo = {
  async getByBookingId(bookingId: string): Promise<DispatchAttemptDoc | null> {
    const { resources } = await getDispatchAttemptsContainer()
      .items
      .query<DispatchAttemptDoc>({
        query: 'SELECT * FROM c WHERE c.bookingId = @bookingId ORDER BY c._ts DESC OFFSET 0 LIMIT 1',
        parameters: [{ name: '@bookingId', value: bookingId }],
      })
      .fetchAll();
    return resources[0] ?? null;
  },

  async getAttemptedTechnicianIds(bookingId: string): Promise<string[]> {
    const { resources } = await getDispatchAttemptsContainer()
      .items
      .query<Pick<DispatchAttemptDoc, 'technicianIds'>>({
        query: 'SELECT c.technicianIds FROM c WHERE c.bookingId = @bookingId',
        parameters: [{ name: '@bookingId', value: bookingId }],
      })
      .fetchAll();
    return [...new Set(resources.flatMap((attempt) => attempt.technicianIds))];
  },

  async acceptAttempt(id: string, bookingId: string): Promise<DispatchAttemptDoc | null> {
    const container = getDispatchAttemptsContainer();
    const { resource } = await container.item(id, id).read<DispatchAttemptDoc & Resource>();
    if (!resource) return null;
    if (resource.bookingId !== bookingId) return null;
    if (resource.status !== 'PENDING') return null;
    // Status alone is not enough: expireStaleOffers sweeps only every 30s, so an attempt past its
    // 90s window still reads PENDING for up to a tick. `declineAttempt` has always enforced this;
    // `acceptAttempt` was the asymmetric one, which let a caller that checked expiry before an
    // awaited round-trip (E21-S04's hold gate) accept an offer that lapsed in between. This is the
    // authoritative layer — the handler's own recheck only shapes the status code.
    if (new Date(resource.expiresAt) <= new Date()) return null;

    const updated: DispatchAttemptDoc = {
      id: resource.id,
      bookingId: resource.bookingId,
      technicianIds: resource.technicianIds,
      sentAt: resource.sentAt,
      expiresAt: resource.expiresAt,
      status: 'ACCEPTED',
    };

    try {
      const { resource: replaced } = await container.item(id, id).replace<DispatchAttemptDoc>(
        updated,
        { accessCondition: { type: 'IfMatch', condition: resource._etag } },
      );
      return replaced ?? null;
    } catch (err: unknown) {
      if (isCosmosConflict(err)) return null;
      throw err;
    }
  },

  async declineAttempt(id: string, bookingId: string): Promise<DispatchAttemptDoc | null> {
    const container = getDispatchAttemptsContainer();
    const { resource } = await container.item(id, id).read<DispatchAttemptDoc & Resource>();
    if (!resource) return null;
    if (resource.bookingId !== bookingId) return null;
    if (resource.status !== 'PENDING') return null;
    if (new Date(resource.expiresAt) <= new Date()) return null;

    const updated: DispatchAttemptDoc = {
      id: resource.id,
      bookingId: resource.bookingId,
      technicianIds: resource.technicianIds,
      sentAt: resource.sentAt,
      expiresAt: resource.expiresAt,
      status: 'EXPIRED',
    };

    try {
      const { resource: replaced } = await container.item(id, id).replace<DispatchAttemptDoc>(
        updated,
        { accessCondition: { type: 'IfMatch', condition: resource._etag } },
      );
      return replaced ?? null;
    } catch (err: unknown) {
      if (isCosmosConflict(err)) return null;
      throw err;
    }
  },
};

function isCosmosConflict(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 412;
}
