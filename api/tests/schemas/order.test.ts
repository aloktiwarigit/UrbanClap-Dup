import { describe, it, expect } from 'vitest';
import {
  OrderStatusEnum, OrderSchema, OrderListQuerySchema, OrderListResponseSchema,
} from '../../src/schemas/order.js';

describe('OrderStatusEnum', () => {
  it('accepts all booking lifecycle statuses (including no-show and cancellation states)', () => {
    [
      'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',
      'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
      'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH', 'CANCELLED',
    ].forEach(s => expect(OrderStatusEnum.parse(s)).toBe(s));
  });
  it('rejects unknown status', () => {
    expect(() => OrderStatusEnum.parse('UNKNOWN')).toThrow();
  });
});

describe('OrderListQuerySchema', () => {
  it('parses comma-separated status into array', () => {
    const result = OrderListQuerySchema.parse({ status: 'ASSIGNED,COMPLETED' });
    expect(result.status).toEqual(['ASSIGNED', 'COMPLETED']);
  });

  it('defaults page to 1 and pageSize to 50', () => {
    const result = OrderListQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
  });

  it('clamps pageSize to max 10000', () => {
    const result = OrderListQuerySchema.parse({ pageSize: '99999' });
    expect(result.pageSize).toBe(10000);
  });

  it('passes through optional filters as strings', () => {
    const result = OrderListQuerySchema.parse({ city: 'Bengaluru', customerPhone: '9999999999' });
    expect(result.city).toBe('Bengaluru');
    expect(result.customerPhone).toBe('9999999999');
  });
});

describe('OrderSchema', () => {
  it('parses a minimal valid order', () => {
    const order = OrderSchema.parse({
      id: 'ord_1', customerId: 'cust_1', customerName: 'Rahul', customerPhone: '9999999999',
      status: 'ASSIGNED', city: 'Bengaluru',
      scheduledAt: new Date().toISOString(), amount: 599, createdAt: new Date().toISOString(),
    });
    expect(order.id).toBe('ord_1');
  });

  it('allows optional technician fields to be absent', () => {
    const order = OrderSchema.parse({
      id: 'ord_2', customerId: 'cust_2', customerName: 'Priya', customerPhone: '8888888888',
      status: 'SEARCHING', city: 'Mysuru',
      scheduledAt: new Date().toISOString(), amount: 299, createdAt: new Date().toISOString(),
    });
    expect(order.technicianId).toBeUndefined();
  });
});

// Ensure OrderListResponseSchema is importable (basic smoke)
describe('OrderListResponseSchema', () => {
  it('is defined', () => {
    expect(OrderListResponseSchema).toBeDefined();
  });
});
