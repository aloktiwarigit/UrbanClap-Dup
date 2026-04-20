import type { Metadata } from 'next';
import { getServerApiClient } from '@/lib/serverApi';
import { listComplaints } from '@/api/complaints';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

export default async function ComplaintsPage() {
  const client = await getServerApiClient();
  // TODO: scope to unresolved only or add server-side pagination once complaint volume exceeds pilot scale
  const data = await listComplaints(client, { pageSize: 200 });
  return <ComplaintsClient initialComplaints={data.items} />;
}
