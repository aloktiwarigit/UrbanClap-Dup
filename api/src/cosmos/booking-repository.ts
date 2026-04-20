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

  async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: 'SELECT * FROM c WHERE c.paymentOrderId = @orderId',
        parameters: [{ name: '@orderId', value: orderId }],
      })
      .fetchAll();
    return resources[0] ?? null;
  },

  async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> {
    const existing = await this.getById(id);
    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 'PENDING_PAYMENT')) return null;
    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async getStaleSearching(olderThanIso: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer().items.query<BookingDoc>({
      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < @cutoff",
      parameters: [{ name: '@cutoff', value: olderThanIso }],
    }).fetchAll();
    return resources;
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
