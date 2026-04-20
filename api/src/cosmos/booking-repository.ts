import { randomUUID } from 'node:crypto';
import { getBookingsContainer } from './client.js';
import type { BookingDoc, CreateBookingRequest } from '../schemas/booking.js';

function now() { return new Date().toISOString(); }

export const bookingRepo = {
  async createPending(
    req: CreateBookingRequest,
    customerId: string,
    paymentOrderId: string,
    amount: number,
  ): Promise<BookingDoc> {
    const doc: BookingDoc = {
      id: randomUUID(), customerId, ...req,
      status: 'PENDING_PAYMENT', paymentOrderId,
      paymentId: null, paymentSignature: null,
      amount, createdAt: now(),
    };
    const { resource } = await getBookingsContainer().items.create<BookingDoc>(doc);
    return resource!;
  },

  async getById(id: string): Promise<BookingDoc | null> {
    const { resource } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    return resource ?? null;
  },

  async confirmPayment(
    id: string,
    paymentId: string,
    paymentSignature: string,
  ): Promise<BookingDoc | null> {
    const existing = await this.getById(id);
    if (!existing || existing.status !== 'PENDING_PAYMENT') return null;
    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, paymentSignature };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },
};

export async function updateBookingFields(
  id: string,
  fields: Partial<BookingDoc>,
): Promise<BookingDoc | null> {
  const existing = await bookingRepo.getById(id);
  if (!existing) return null;
  const updated: BookingDoc = { ...existing, ...fields };
  const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
  return resource ?? null;
}
