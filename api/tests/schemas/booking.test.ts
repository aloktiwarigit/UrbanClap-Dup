import { describe, it, expect } from 'vitest';
import { BookingDocSchema, CreateBookingRequestSchema, ConfirmBookingRequestSchema } from '../../src/schemas/booking.js';

const validDoc = {
  id: 'bk-1', customerId: 'c1', serviceId: 's1', categoryId: 'cat1',
  slotDate: '2026-05-01', slotWindow: '10:00-12:00',
  addressText: '123 Main St', addressLatLng: { lat: 12.97, lng: 77.59 },
  status: 'SEARCHING', paymentOrderId: 'order_xyz',
  paymentId: null, paymentSignature: null, amount: 59900,
  createdAt: '2026-04-20T10:00:00.000Z',
};

describe('BookingDocSchema', () => {
  it('parses a valid booking document', () => { expect(() => BookingDocSchema.parse(validDoc)).not.toThrow(); });
  it('rejects invalid status', () => { expect(() => BookingDocSchema.parse({ ...validDoc, status: 'BOGUS' })).toThrow(); });
  it('rejects malformed slotWindow', () => { expect(() => BookingDocSchema.parse({ ...validDoc, slotWindow: 'morning' })).toThrow(); });
  it('accepts PENDING_PAYMENT status', () => { expect(() => BookingDocSchema.parse({ ...validDoc, status: 'PENDING_PAYMENT' })).not.toThrow(); });
});

describe('CreateBookingRequestSchema', () => {
  const v = { serviceId: 's1', categoryId: 'c1', slotDate: '2026-05-01', slotWindow: '08:00-10:00', addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 } };
  it('parses valid request', () => { expect(() => CreateBookingRequestSchema.parse(v)).not.toThrow(); });
  it('rejects empty serviceId', () => { expect(() => CreateBookingRequestSchema.parse({ ...v, serviceId: '' })).toThrow(); });
  it('rejects invalid slotWindow format', () => { expect(() => CreateBookingRequestSchema.parse({ ...v, slotWindow: 'morning' })).toThrow(); });
});

describe('ConfirmBookingRequestSchema', () => {
  it('parses valid confirm', () => {
    expect(() => ConfirmBookingRequestSchema.parse({ razorpayPaymentId: 'p1', razorpayOrderId: 'o1', razorpaySignature: 's1' })).not.toThrow();
  });
  it('rejects empty signature', () => {
    expect(() => ConfirmBookingRequestSchema.parse({ razorpayPaymentId: 'p1', razorpayOrderId: 'o1', razorpaySignature: '' })).toThrow();
  });
});
