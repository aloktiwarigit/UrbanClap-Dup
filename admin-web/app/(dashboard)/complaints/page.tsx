import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/serverApi';
import { ApiError } from '@/api/client';
import { listComplaints } from '@/api/complaints';
import type { Complaint } from '@/types/complaint';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

export default async function ComplaintsPage() {
  const client = await getServerApiClient();

  let activeItems: Complaint[] = [];
  let recentResolved: Complaint[] = [];
  let apiTotal = 0;
  try {
    // Two separate queries so long-running active complaints (>30d) are never hidden
    // by all-time RESOLVED volume consuming the 200-slot page limit.
    const [activeData, resolvedData] = await Promise.all([
      listComplaints(client, { status: 'NEW,INVESTIGATING', pageSize: 200 }),
      listComplaints(client, {
        status: 'RESOLVED',
        resolvedSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        pageSize: 50,
      }),
    ]);
    activeItems = activeData.items;
    recentResolved = resolvedData.items;
    apiTotal = activeData.total + resolvedData.total;
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) redirect('/dashboard');
    throw err;
  }

  const allComplaints = [...activeItems, ...recentResolved];

  return <ComplaintsClient initialComplaints={allComplaints} totalComplaints={apiTotal} />;
}
