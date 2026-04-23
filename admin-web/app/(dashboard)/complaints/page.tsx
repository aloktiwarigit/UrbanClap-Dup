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

  let allComplaints: Complaint[] = [];
  let total = 0;
  try {
    // Two separate single-page queries so active complaints are never crowded
    // out by the 30-day resolved volume. Each is a single consistent snapshot,
    // so no offset-shift race within either read.
    const [activeData, resolvedData] = await Promise.all([
      listComplaints(client, {
        status: 'NEW,INVESTIGATING',
        sortDir: 'asc',  // oldest active complaints first — most urgent
        page: 1,
        pageSize: 500,   // covers all pilot-scale active queues in one read
      }),
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
