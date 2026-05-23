import type { Metadata } from 'next';
import { getServerApiClient } from '@/lib/serverApi';
import { listCustomers } from '@/api/customers';
import { CustomerListClient } from './CustomerListClient';
import type { AdminCustomer } from '@/types/customer-admin';

export const metadata: Metadata = { title: 'Customers — HomeHeroo Admin' };
export const dynamic = 'force-dynamic';

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const client = await getServerApiClient();

  let customers: AdminCustomer[] = [];
  let fetchError: string | null = null;
  try {
    const result = await listCustomers(client);
    customers = result.customers;
  } catch (err) {
    // Surface the error inline instead of silently rendering empty.
    // An empty list is ambiguous — could be "no customers" OR a failing API.
    // Showing the message lets the operator distinguish and acts as a diagnostic
    // when the backend rejects (e.g. missing Cosmos container, 403, network).
    fetchError = err instanceof Error ? err.message : String(err);
  }

  return <CustomerListClient initialCustomers={customers} fetchError={fetchError} />;
}
