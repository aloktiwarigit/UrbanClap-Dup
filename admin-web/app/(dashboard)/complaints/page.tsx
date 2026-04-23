import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/serverApi';
import { ApiError } from '@/api/client';
import { listComplaints } from '@/api/complaints';
import type { ApiClient } from '@/api/client';
import type { Complaint } from '@/types/complaint';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

// Paginate through all active complaints so the board always shows every open
// ticket regardless of queue depth. Active→resolved transitions between pages
// are caught by the parallel resolved query + dedup, so the offset-shift risk
// is bounded and does not cause omissions of active items.
async function fetchAllActive(client: ApiClient): Promise<{ items: Complaint[]; total: number }> {
  const items: Complaint[] = [];
  let page = 1;
  let total = Infinity;
  while (items.length < total) {
    const data = await listComplaints(client, {
      status: 'NEW,INVESTIGATING',
      sortDir: 'asc',
      page,
      pageSize: 200, // API max (schema clamps higher values to 200)
    });
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
    // Two separate queries so active complaints are never crowded out by the
    // 30-day resolved volume. Active uses pagination to guarantee all tickets
    // are fetched; resolved is capped to a single page.
    const [activeData, resolvedData] = await Promise.all([
      fetchAllActive(client),
      listComplaints(client, {
        status: 'RESOLVED',
        resolvedSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        sortDir: 'desc', // most recently resolved first
        page: 1,
        pageSize: 100,
      }),
    ]);

    // Deduplicate by id — a complaint can appear in both result sets if its
    // status flips while the two queries are in flight. Prefer the copy with
    // the later updatedAt so both resolve-race and reopen-race are handled.
    const resolvedById = new Map(resolvedData.items.map((c) => [c.id, c]));
    allComplaints = [
      ...activeData.items.map((c) => {
        const resolved = resolvedById.get(c.id);
        if (!resolved) return c;
        return resolved.updatedAt >= c.updatedAt ? resolved : c;
      }),
      ...resolvedData.items.filter((c) => !activeData.items.some((a) => a.id === c.id)),
    ];
    const duplicates = activeData.items.length + resolvedData.items.length - allComplaints.length;
    total = activeData.total + resolvedData.total - duplicates;
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
