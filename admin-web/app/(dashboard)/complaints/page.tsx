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

  let allComplaints: Complaint[] = [];
  let total = 0;
  try {
    // Single query: active complaints are always included; resolved complaints are
    // bounded to the last 30 days to cap volume. The API applies resolvedSince as
    // "(NOT IS_DEFINED(resolvedAt) OR resolvedAt >= X)" so active items are never
    // excluded. One snapshot avoids the dual-query race where a status flip between
    // requests causes a complaint to be absent from both result sets.
    const data = await fetchAllPages(client, {
      resolvedSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      sortDir: 'asc',
    });
    allComplaints = data.items;
    total = data.total;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/dashboard');
    // 404 means the complaints container hasn't been provisioned yet (fresh/staging
    // deployment) — treat as empty rather than crashing the page.
    if (err instanceof ApiError && err.status === 404) {
      return <ComplaintsClient initialComplaints={[]} totalComplaints={0} />;
    }
    throw err;
  }

  return <ComplaintsClient initialComplaints={allComplaints} totalComplaints={total} />;
}
