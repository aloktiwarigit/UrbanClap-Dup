import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/serverApi';
import { ApiError } from '@/api/client';
import { listComplaints } from '@/api/complaints';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

export default async function ComplaintsPage() {
  const client = await getServerApiClient();
  // dateFrom bounds the fetch to the last 30 days so all-time RESOLVED volume never
  // crowds out active complaints within the 200-slot page limit. Active (NEW/INVESTIGATING)
  // complaints are always within this window; recently resolved ones remain visible after reload.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let data: Awaited<ReturnType<typeof listComplaints>>;
  try {
    data = await listComplaints(client, { dateFrom: thirtyDaysAgo, pageSize: 200 });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) redirect('/dashboard');
    throw err;
  }
  return <ComplaintsClient initialComplaints={data.items} totalComplaints={data.total} />;
}
