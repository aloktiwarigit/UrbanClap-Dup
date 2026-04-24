import { randomUUID } from 'node:crypto';
import { getBookingEventsContainer } from './client.js';
import type { BookingEventDoc } from '../schemas/booking-event.js';

export const bookingEventRepo = {
  async append(event: Omit<BookingEventDoc, 'id' | 'ts'>): Promise<void> {
    const doc: BookingEventDoc = {
      ...event,
      id: randomUUID(),
      ts: new Date().toISOString(),
    };
    await getBookingEventsContainer().items.create<BookingEventDoc>(doc);
  },
};
