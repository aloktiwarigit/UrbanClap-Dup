import type { Metadata } from 'next';
import { getServerApiClient } from '@/lib/serverApi';
import { listComplaints } from '@/api/complaints';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

export default async function ComplaintsPage() {
  const client = await getServerApiClient();
  // pageSize capped at 200 by the API schema; at pilot scale (≤200 open complaints)
  // this loads the full inbox. Add cursor pagination here when volume grows beyond 200.
  const data = await listComplaints(client, { pageSize: 200 });
  return <ComplaintsClient initialComplaints={data.items} totalComplaints={data.total} />;
}
