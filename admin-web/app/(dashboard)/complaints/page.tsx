import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/serverApi';
import { ApiError } from '@/api/client';
import { listComplaints } from '@/api/complaints';
import type { Complaint } from '@/types/complaint';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

// Single-page cap: a single consistent snapshot avoids the offset-shift race
// where complaints inserted or status-changed between paginated reads can cause
// duplicates or omissions. The board already shows "X of Y loaded" when total > PAGE_SIZE.
const PAGE_SIZE = 100;

export default async function ComplaintsPage() {
  const client = await getServerApiClient();

  let allComplaints: Complaint[] = [];
  let total = 0;
  try {
    // Single snapshot: resolvedSince includes active complaints (no resolvedAt)
    // plus recently-resolved ones via the NOT IS_DEFINED guard in the repository.
    const data = await listComplaints(client, {
      resolvedSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      sortDir: 'asc',
      page: 1,
      pageSize: PAGE_SIZE,
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
