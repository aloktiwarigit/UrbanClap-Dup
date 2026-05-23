import { describe, it, expect } from 'vitest';
import { buildOrdersCsv } from '../src/components/orders/exportCsv';
import type { Order } from '../src/types/order';

const order: Order = {
  id: 'ord_1', customerId: 'c1', customerName: 'Rahul, Jr.', customerPhone: '9999999999',
  serviceName: 'AC Repair', technicianName: 'Ravi', status: 'COMPLETED', city: 'Bengaluru',
  scheduledAt: '2026-04-19T10:00:00.000Z', amount: 59900, createdAt: '2026-04-19T09:00:00.000Z',
};

// Simple t() stub that returns the English header value matching the catalog
const tHeaders = (key: string): string => {
  const map: Record<string, string> = {
    orderId: 'Order ID',
    customerName: 'Customer Name',
    customerPhone: 'Customer Phone',
    serviceName: 'Service Name',
    technicianName: 'Technician Name',
    status: 'Status',
    city: 'City',
    scheduledAt: 'Scheduled At',
    amount: 'Amount (INR)',
    createdAt: 'Created At',
  };
  return map[key] ?? key;
};

describe('buildOrdersCsv', () => {
  it('starts with header row containing Order ID, Customer Name, Amount (INR)', () => {
    const csv = buildOrdersCsv([], tHeaders);
    expect(csv.startsWith('Order ID')).toBe(true);
    expect(csv).toContain('Customer Name');
    expect(csv).toContain('Amount (INR)');
  });

  it('includes order data in the data row', () => {
    const csv = buildOrdersCsv([order], tHeaders);
    expect(csv).toContain('ord_1');
    expect(csv).toContain('9999999999');
    expect(csv).toContain('599'); // amount in INR (paise/100)
  });

  it('wraps values containing commas in double quotes', () => {
    const csv = buildOrdersCsv([order], tHeaders);
    expect(csv).toContain('"Rahul, Jr."');
  });
});
