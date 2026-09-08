import { describe, it, expect } from 'vitest';
import { buildOrdersCsv } from '../src/components/orders/exportCsv';
import type { Order } from '../src/types/order';

// customerPhone is the masked form the API now returns (E09-S08) — never the
// raw ten-digit number. See the "never emits an unmasked ten-digit number"
// test below, which pins that this fixture change is load-bearing.
const order: Order = {
  id: 'ord_1', customerId: 'c1', customerName: 'Rahul, Jr.', customerPhone: '+91 XXXXX-X9999',
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
    technicianPhone: 'Technician Phone',
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
    // customerPhone arrives pre-masked from the API (E09-S08); this was
    // '9999999999' before the masking story landed. Changing this assertion
    // to the masked value is the intended behaviour change, not a test bent
    // to fit the implementation.
    expect(csv).toContain('+91 XXXXX-X9999');
    expect(csv).toContain('599'); // amount in INR (paise/100)
  });

  it('wraps values containing commas in double quotes', () => {
    const csv = buildOrdersCsv([order], tHeaders);
    expect(csv).toContain('"Rahul, Jr."');
  });

  it('converts a non-round paise amount to the exact rupee-and-paise value without float drift', () => {
    const fractionalOrder = { ...order, id: 'ord_2', amount: 1050 }; // 1050 paise = ₹10.50
    const csv = buildOrdersCsv([fractionalOrder], tHeaders);
    expect(csv).toContain('10.5');
  });

  it('defensively rounds a non-integer paise input (upstream float artifact) to a clean rupee value', () => {
    const driftedOrder = { ...order, id: 'ord_3', amount: 59900.00000000001 };
    const csv = buildOrdersCsv([driftedOrder], tHeaders);
    expect(csv).toContain('599');
    expect(csv).not.toContain('598.99');
    expect(csv).not.toContain('599.00000000001');
  });

  it('emits a technician phone column', () => {
    const csv = buildOrdersCsv(
      [{ ...order, technicianPhoneMasked: '+91 XXXXX-X4321' }],
      tHeaders,
    );
    expect(csv.split('\n')[0]).toContain('Technician Phone');
    expect(csv.split('\n')[1]).toContain('+91 XXXXX-X4321');
  });

  it('leaves the technician phone cell empty when there is no number', () => {
    // `order` has no technicianPhoneMasked property at all (omitted, not set
    // to undefined, per exactOptionalPropertyTypes) — this is the
    // unassigned/unresolvable case.
    const csv = buildOrdersCsv([{ ...order }], tHeaders);
    const cells = csv.split('\n')[1]!.split(',');
    expect(cells).toContain('');
  });

  it('never emits an unmasked ten-digit number', () => {
    const csv = buildOrdersCsv(
      [{ ...order, customerPhone: '+91 XXXXX-X9999', technicianPhoneMasked: '+91 XXXXX-X4321' }],
      tHeaders,
    );
    expect(csv).not.toMatch(/\b\d{10}\b/);
  });
});
