import type { Resource } from '@azure/cosmos';
import { getDispatchAttemptsContainer } from './client.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';

export const dispatchAttemptRepo = {
  async getByBookingId(bookingId: string): Promise<DispatchAttemptDoc | null> {
    const { resources } = await getDispatchAttemptsContainer()
      .items
      .query<DispatchAttemptDoc>({
        query: 'SELECT * FROM c WHERE c.bookingId = @bookingId',
        parameters: [{ name: '@bookingId', value: bookingId }],
      })
      .fetchAll();
    return resources[0] ?? null;
  },

  async acceptAttempt(id: string, bookingId: string): Promise<DispatchAttemptDoc | null> {
    const container = getDispatchAttemptsContainer();
    const { resource } = await container.item(id, bookingId).read<DispatchAttemptDoc & Resource>();
    if (!resource) return null;
    if (resource.status !== 'PENDING') return null;
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
      const { resource: replaced } = await container.item(id, bookingId).replace<DispatchAttemptDoc>(
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
