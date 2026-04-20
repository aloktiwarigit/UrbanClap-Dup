import { describe, it, expect } from 'vitest';
import { buildOrdersCsv } from '../src/components/orders/exportCsv';
import type { Order } from '../src/types/order';

const order: Order = {
  id: 'ord_1', customerId: 'c1', customerName: 'Rahul, Jr.', customerPhone: '9999999999',
  serviceName: 'AC Repair', technicianName: 'Ravi', status: 'COMPLETED', city: 'Bengaluru',
  scheduledAt: '2026-04-19T10:00:00.000Z', amount: 59900, createdAt: '2026-04-19T09:00:00.000Z',
};

describe('buildOrdersCsv', () => {
  it('starts with header row containing Order ID, Customer Name, Amount (INR)', () => {
    const csv = buildOrdersCsv([]);
    expect(csv.startsWith('Order ID')).toBe(true);
    expect(csv).toContain('Customer Name');
    expect(csv).toContain('Amount (INR)');
  });

  it('includes order data in the data row', () => {
    const csv = buildOrdersCsv([order]);
    expect(csv).toContain('ord_1');
    expect(csv).toContain('9999999999');
    expect(csv).toContain('599'); // amount in INR (paise/100)
  });

  it('wraps values containing commas in double quotes', () => {
    const csv = buildOrdersCsv([order]);
    expect(csv).toContain('"Rahul, Jr."');
  });
});
