import { randomUUID } from 'node:crypto';
import { getBookingsContainer } from './client.js';
import type { BookingDoc, CreateBookingRequest } from '../schemas/booking.js';
import type { PendingAddOn, AddOnDecision } from '../schemas/addon-approval.js';

function now() { return new Date().toISOString(); }

export const bookingRepo = {
  async createPending(
    req: CreateBookingRequest,
    customerId: string,
    paymentOrderId: string,
    amount: number,
  ): Promise<BookingDoc> {
    const paymentMethod = req.paymentMethod ?? 'RAZORPAY';
    const doc: BookingDoc = {
      id: randomUUID(), customerId, ...req,
      status: 'PENDING_PAYMENT', paymentOrderId,
      paymentMethod,
      ...(paymentMethod === 'CASH_ON_SERVICE' ? { cashCollectionStatus: 'PENDING' as const } : {}),
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
    if (!existing) return null;
    if (existing.status === 'PAID') return existing; // webhook already processed — idempotent success
    if (existing.status !== 'PENDING_PAYMENT') return null;
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

  async getAssignedBookingsBefore(slotDateCutoff: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: "SELECT * FROM c WHERE (c.status IN ('ASSIGNED', 'NO_SHOW_REDISPATCH') OR (c.status = 'SEARCHING' AND IS_DEFINED(c.noShowTechnicianId))) AND c.slotDate <= @slotDate",
        parameters: [{ name: '@slotDate', value: slotDateCutoff }],
      })
      .fetchAll();
    return resources;
  },

  async requestAddOn(id: string, addOn: PendingAddOn): Promise<BookingDoc | null> {
    const existing = await this.getById(id);
    if (!existing || existing.status !== 'IN_PROGRESS') return null;
    const updated: BookingDoc = {
      ...existing,
      status: 'AWAITING_PRICE_APPROVAL',
      pendingAddOns: [...(existing.pendingAddOns ?? []), addOn],
    };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async applyAddOnDecisions(id: string, customerId: string, decisions: AddOnDecision[]): Promise<BookingDoc | null> {
    const existing = await this.getById(id);
    if (!existing || existing.customerId !== customerId) return null;
    if (existing.status !== 'AWAITING_PRICE_APPROVAL') return null;
    const pending = existing.pendingAddOns ?? [];
    const approved = pending.filter(a => decisions.find(d => d.name === a.name && d.approved));
    const updated: BookingDoc = {
      ...existing,
      status: 'IN_PROGRESS',
      pendingAddOns: [],
      approvedAddOns: [...(existing.approvedAddOns ?? []), ...approved],
      finalAmount: (existing.finalAmount ?? existing.amount) + approved.reduce((s, a) => s + a.price, 0),
    };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async addPhoto(
    bookingId: string,
    stage: string,
    photoUrl: string,
  ): Promise<BookingDoc | null> {
    const { resource: existing, etag } = await getBookingsContainer()
      .item(bookingId, bookingId)
      .read<BookingDoc>();
    if (!existing) return null;
    const stagePhotos = existing.photos?.[stage] ?? [];
    const updated: BookingDoc = {
      ...existing,
      photos: { ...existing.photos, [stage]: [...stagePhotos, photoUrl] },
    };
    // Use ETag optimistic concurrency so concurrent uploads for the same
    // booking/stage don't silently drop each other's photo URL.
    const { resource } = await getBookingsContainer()
      .item(bookingId, bookingId)
      .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
    return resource ?? null;
  },

  async markSosActivated(id: string): Promise<BookingDoc | null> {
    const { resource: existing, etag } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    if (!existing) return null;
    if (existing.sosActivatedAt) return existing; // already activated — concurrent request lost the race
    const updated: BookingDoc = { ...existing, sosActivatedAt: new Date().toISOString() };
    try {
      const { resource } = await getBookingsContainer()
        .item(id, id)
        .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
      return resource ?? null;
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 412) {
        return null; // lost ETag race — caller handles as already-activated
      }
      throw e;
    }
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
