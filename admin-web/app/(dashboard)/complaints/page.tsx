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

async function fetchAllPages(
  client: ApiClient,
  baseParams: Omit<ListComplaintsParams, 'page' | 'pageSize'>,
): Promise<{ items: Complaint[]; total: number }> {
  const items: Complaint[] = [];
  let page = 1;
  let total = Infinity;
  while (items.length < total) {
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
      fetchAllPages(client, { status: 'NEW,INVESTIGATING', sortDir: 'asc' }),
      fetchAllPages(client, {
        status: 'RESOLVED',
        resolvedSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ]);
    activeItems = activeData.items;
    recentResolved = resolvedData.items;
    apiTotal = activeData.total + resolvedData.total;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/dashboard');
    throw err;
  }

  // Deduplicate by id — a complaint can appear in both queries if its status
  // flips while the Promise.all is in flight (resolve or reopen). Prefer the
  // copy with the later updatedAt so both races are handled symmetrically.
  const resolvedById = new Map(recentResolved.map((c) => [c.id, c]));
  const allComplaints = [
    ...activeItems.map((c) => {
      const resolved = resolvedById.get(c.id);
      if (!resolved) return c;
      return resolved.updatedAt >= c.updatedAt ? resolved : c;
    }),
    ...recentResolved.filter((c) => !activeItems.some((a) => a.id === c.id)),
  ];
  // Subtract duplicates from the total so the header count stays consistent.
  const dedupedTotal = apiTotal - (activeItems.length + recentResolved.length - allComplaints.length);

  return <ComplaintsClient initialComplaints={allComplaints} totalComplaints={dedupedTotal} />;
}
