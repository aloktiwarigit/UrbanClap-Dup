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

  const [activeResult, resolvedResult] = await Promise.allSettled([
    listComplaints(client, {
      status: 'NEW,INVESTIGATING',
      sortDir: 'asc',
      page: 1,
      pageSize: 200,
    }),
    listComplaints(client, {
      status: 'RESOLVED',
      resolvedSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      sortDir: 'desc',
      page: 1,
      pageSize: 100,
    }),
  ]);

  // 401/403 from either query → bounce to dashboard (auth issue).
  for (const r of [activeResult, resolvedResult]) {
    if (r.status === 'rejected' && r.reason instanceof ApiError) {
      if (r.reason.status === 401 || r.reason.status === 403) redirect('/dashboard');
    }
  }

  // Recoverable errors (the page renders an empty state):
  //   - ApiError 404: complaints container not provisioned yet (fresh deploy)
  //   - TypeError: network failure / `fetch failed` (api/ offline in dev)
  // Anything else (5xx, schema errors, unknown) re-throws — (dashboard)/error.tsx
  // catches it and shows "Something stalled. Try again." so operators don't see
  // an empty board when the API actually broke.
  function isRecoverableError(e: unknown): boolean {
    if (e instanceof ApiError) return e.status === 404;
    if (e instanceof TypeError) return true;
    return false;
  }

  function unwrap<T>(r: PromiseSettledResult<T>, fallback: T): T {
    if (r.status === 'fulfilled') return r.value;
    if (isRecoverableError(r.reason)) return fallback;
    throw r.reason;
  }

  const empty = { items: [] as Complaint[], total: 0 };
  const activeData = unwrap(activeResult, empty);
  const resolvedData = unwrap(resolvedResult, empty);

  // Deduplicate by id (a complaint can flip status between the two queries).
  const resolvedById = new Map(resolvedData.items.map((c) => [c.id, c]));
  const allComplaints: Complaint[] = [
    ...activeData.items.map((c) => {
      const resolved = resolvedById.get(c.id);
      if (!resolved) return c;
      return resolved.updatedAt >= c.updatedAt ? resolved : c;
    }),
    ...resolvedData.items.filter((c) => !activeData.items.some((a) => a.id === c.id)),
  ];

  const duplicates = activeData.items.length + resolvedData.items.length - allComplaints.length;
  const total = activeData.total + resolvedData.total - duplicates;

  return <ComplaintsClient initialComplaints={allComplaints} totalComplaints={total} />;
}
