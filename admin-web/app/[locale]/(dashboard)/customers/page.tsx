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
  try {
    const result = await listCustomers(client);
    customers = result.customers;
  } catch {
    // Network failure — show empty state
  }

  return <CustomerListClient initialCustomers={customers} />;
}
