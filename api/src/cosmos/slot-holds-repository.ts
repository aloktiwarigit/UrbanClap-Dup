import { getSlotHoldsContainer } from './client.js';
import type { SlotHoldDoc } from '../schemas/slot-hold.js';

export class SlotHoldsRepository {
  private get container() { return getSlotHoldsContainer(); }

  /**
   * Attempts to create a soft hold for the given slot.
   * Returns the hold doc on success, or 'CONFLICT' if the slot is already held
   * (Cosmos 409) or there is an optimistic-concurrency conflict (Cosmos 412 —
   * same fallback pattern as ADR-0017 §5 wallet etag).
   */
  async createHold(
    serviceId: string,
    date: string,
    window: string,
    customerId: string,
  ): Promise<SlotHoldDoc | 'CONFLICT'> {
    const id = `${serviceId}|${date}|${window}`;
    const servicePartitionKey = `${serviceId}|${date}`;
    // Note: ttl is intentionally omitted — the container default (30 s) applies automatically.
    // exactOptionalPropertyTypes=true means we can't pass ttl?: number | undefined to create<T>.
    const doc = {
      id,
      servicePartitionKey,
      serviceId,
      date,
      window,
      customerId,
      heldAt: new Date().toISOString(),
    } satisfies Omit<SlotHoldDoc, 'bookingId' | 'ttl'>;

    try {
      const { resource } = await this.container.items.create(doc);
      return resource as SlotHoldDoc;
    } catch (err: unknown) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 409 || code === 412) return 'CONFLICT';
      throw err;
    }
  }

  /**
   * Converts a soft hold to a permanent booking-owned slot record.
   * Uses Cosmos PATCH to write bookingId and set ttl=-1 (no expiry).
   * If the hold has already expired (404), logs a warning and returns silently —
   * the booking succeeded and the slot will be visible via the bookings query.
   */
  async commitHold(holdId: string, servicePartitionKey: string, bookingId: string): Promise<void> {
    try {
      await this.container.item(holdId, servicePartitionKey).patch([
        { op: 'add', path: '/bookingId', value: bookingId },
        { op: 'replace', path: '/ttl', value: -1 },
      ]);
    } catch (err: unknown) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404) {
        console.warn('[slotHoldsRepo] commitHold: hold already expired (non-fatal)', { holdId, bookingId });
        return;
      }
      throw err;
    }
  }

  /**
   * Lists all hold docs for a given service+date partition.
   * Cosmos TTL means expired docs are excluded automatically by the engine.
   */
  async listHolds(serviceId: string, date: string): Promise<SlotHoldDoc[]> {
    const pk = `${serviceId}|${date}`;
    const { resources } = await this.container.items
      .query<SlotHoldDoc>({
        query: 'SELECT * FROM c WHERE c.servicePartitionKey = @pk',
        parameters: [{ name: '@pk', value: pk }],
      })
      .fetchAll();
    return resources;
  }
}

export const slotHoldsRepo = new SlotHoldsRepository();
