import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/serverApi';
import { ApiError } from '@/api/client';
import { listComplaints, type ListComplaintsParams } from '@/api/complaints';
import type { ApiClient } from '@/api/client';
import type { Complaint } from '@/types/complaint';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

const PAGE_SIZE = 100;
const MAX_ITEMS = 500;

async function fetchAllPages(
  client: ApiClient,
  baseParams: Omit<ListComplaintsParams, 'page' | 'pageSize'>,
): Promise<{ items: Complaint[]; total: number }> {
  const items: Complaint[] = [];
  let page = 1;
  let total = Infinity;
  while (items.length < total && items.length < MAX_ITEMS) {
    const data = await listComplaints(client, { ...baseParams, page, pageSize: PAGE_SIZE });
    items.push(...data.items);
    total = data.total;
    if (data.items.length === 0) break;
    page += 1;
  }
  return { items, total };
}

export default async function ComplaintsPage() {
  const client = await getServerApiClient();

  let activeItems: Complaint[] = [];
  let recentResolved: Complaint[] = [];
  let apiTotal = 0;
  try {
    // Two separate queries so long-running active complaints (>30d) are never hidden
    // by all-time RESOLVED volume consuming the page limit.
    const [activeData, resolvedData] = await Promise.all([
      fetchAllPages(client, { status: 'NEW,INVESTIGATING' }),
      fetchAllPages(client, {
        status: 'RESOLVED',
        resolvedSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
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
