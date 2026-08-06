import type { ApiClient } from './client';
import { BROWSER_API_BASE_URL } from './base';
import type { AdminCustomerListResponse, CustomerStatus } from '@/types/customer-admin';

const BASE = BROWSER_API_BASE_URL;

export async function listCustomers(client: ApiClient): Promise<AdminCustomerListResponse> {
  const { data, error } = await client.GET('/v1/admin/customers' as never, {} as never);
  if (error !== undefined || data === undefined) throw new Error('listCustomers: request failed');
  return data;
}

export async function patchCustomer(id: string, accountStatus: CustomerStatus): Promise<void> {
  const res = await fetch(`${BASE}/v1/admin/customers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ accountStatus }),
  });
  if (!res.ok) throw new Error(`patchCustomer: ${res.status}`);
}

export async function addCustomerNote(id: string, text: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/admin/customers/${encodeURIComponent(id)}/notes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`addCustomerNote: ${res.status}`);
}

/**
 * NOTE: `amountRupees` is denominated in whole rupees, NOT paise — the only
 * money value in admin-web that breaks the paise convention used everywhere
 * else (see `@/lib/format/intl` for the canonical paise-based formatter).
 * This matches the `/v1/admin/customers/:id/refund-credit` API contract.
 * Do not route this value through `formatINR`/`paiseToRupeeNumber` — doing
 * so would silently divide it by 100 again.
 */
export async function refundCredit(id: string, amountRupees: number, reason: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/admin/customers/${encodeURIComponent(id)}/refund-credit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amountRupees, reason }),
  });
  if (!res.ok) throw new Error(`refundCredit: ${res.status}`);
}
