import { getCosmosClient, DB_NAME } from './client.js';
import type { LiveLocationDoc } from '../schemas/live-location.js';

function getContainer() {
  return getCosmosClient().database(DB_NAME).container('live_locations');
}

export const liveLocationRepo = {
  /**
   * Upserts the latest location for an active booking.
   * doc.id must equal doc.bookingId (single doc per booking, last-write-wins).
   */
  async upsert(doc: LiveLocationDoc): Promise<void> {
    await getContainer().items.upsert(doc);
  },

  /**
   * Returns the most recent location doc for a booking, or null if none exists.
   * Uses a single-partition point-read (bookingId is both id and partition key).
   */
  async getLatest(bookingId: string): Promise<LiveLocationDoc | null> {
    const { resource } = await getContainer()
      .item(bookingId, bookingId)
      .read<LiveLocationDoc>();
    return resource ?? null;
  },
};
