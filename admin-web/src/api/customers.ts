import { createApiClient, type ApiClient } from './client';
import { BROWSER_API_BASE_URL } from './base';
import type {
  AdminCustomer,
  AdminCustomerListResponse,
  CustomerStatus,
} from '../types/customer-admin';

// Client-side base URL. When NEXT_PUBLIC_API_BASE_URL is unset, calls go through
// the admin-web route-handler proxy so Free-tier SWA does not need linked backend.
const CLIENT_BASE = BROWSER_API_BASE_URL;

// Lazy singleton — created on first mutation call, reused for 401-refresh support.
let _browserClient: ApiClient | undefined;
function getBrowserClient(): ApiClient {
  if (_browserClient === undefined) {
    _browserClient = createApiClient({ baseUrl: CLIENT_BASE, credentials: 'include' });
  }
  return _browserClient;
}

export async function patchCustomerClient(
  id: string,
  accountStatus: CustomerStatus,
): Promise<void> {
  return patchCustomer(getBrowserClient(), id, accountStatus);
}

export async function addCustomerNoteClient(
  id: string,
  text: string,
): Promise<void> {
  return addCustomerNote(getBrowserClient(), id, text);
}

export async function refundCreditClient(
  id: string,
  amountRupees: number,
  reason: string,
): Promise<void> {
  return refundCredit(getBrowserClient(), id, amountRupees, reason);
}

export async function listCustomers(
  client: ApiClient,
): Promise<AdminCustomerListResponse> {
  const { data, error } = await client.GET('/v1/admin/customers' as never, {});
  if (error !== undefined || data === undefined) {
    if ((error as unknown) instanceof Error) throw error as unknown as Error;
    throw new Error('listCustomers: request failed');
  }
  return data;
}

export async function patchCustomer(
  client: ApiClient,
  id: string,
  accountStatus: CustomerStatus,
): Promise<void> {
  const { data, error } = await client.PATCH('/v1/admin/customers/{id}', {
    params: { path: { id } },
    body: { accountStatus },
  });
  if (error !== undefined || data === undefined) {
    if ((error as unknown) instanceof Error) throw error as unknown as Error;
    throw new Error('patchCustomer: request failed');
  }
}

export async function addCustomerNote(
  client: ApiClient,
  id: string,
  text: string,
): Promise<void> {
  const { data, error } = await client.POST(
    '/v1/admin/customers/{id}/notes',
    {
      params: { path: { id } },
      body: { text },
    },
  );
  if (error !== undefined || data === undefined) {
    if ((error as unknown) instanceof Error) throw error as unknown as Error;
    throw new Error('addCustomerNote: request failed');
  }
}

export async function refundCredit(
  client: ApiClient,
  id: string,
  amountRupees: number,
  reason: string,
): Promise<void> {
  const { data, error } = await client.POST(
    '/v1/admin/customers/{id}/refund-credit',
    {
      params: { path: { id } },
      body: { amountRupees, reason },
    },
  );
  if (error !== undefined || data === undefined) {
    if ((error as unknown) instanceof Error) throw error as unknown as Error;
    throw new Error('refundCredit: request failed');
  }
}
