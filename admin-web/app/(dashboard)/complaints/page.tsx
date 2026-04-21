import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/serverApi';
import { ApiError } from '@/api/client';
import { listComplaints } from '@/api/complaints';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

export default async function ComplaintsPage() {
  const client = await getServerApiClient();
  // status filter keeps the 200-slot page bounded to the active inbox.
  // Resolved complaints are excluded so historical volume never crowds out NEW/INVESTIGATING items.
  let data: Awaited<ReturnType<typeof listComplaints>>;
  try {
    data = await listComplaints(client, { status: 'NEW,INVESTIGATING', pageSize: 200 });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) redirect('/dashboard');
    throw err;
  }
  return <ComplaintsClient initialComplaints={data.items} totalComplaints={data.total} />;
}
