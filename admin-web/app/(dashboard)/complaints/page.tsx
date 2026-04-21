import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/serverApi';
import { listComplaints } from '@/api/complaints';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

export default async function ComplaintsPage() {
  const client = await getServerApiClient();
  // pageSize capped at 200 by the API schema; at pilot scale (≤200 open complaints)
  // this loads the full inbox. Add cursor pagination here when volume grows beyond 200.
  let data: Awaited<ReturnType<typeof listComplaints>>;
  try {
    data = await listComplaints(client, { pageSize: 200 });
  } catch {
    // Unauthorized roles (finance, support-agent) receive a 403 from the API.
    // Redirect rather than letting the SSR render crash with a 500.
    redirect('/dashboard');
  }
  return <ComplaintsClient initialComplaints={data.items} totalComplaints={data.total} />;
}
