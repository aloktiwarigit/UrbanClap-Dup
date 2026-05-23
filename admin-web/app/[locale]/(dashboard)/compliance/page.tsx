export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getApiBaseUrl } from '@/lib/apiBase';
import { handleAdminFetchError } from '@/lib/serverFetch';
import type {
  ErasureRequestsResponse,
  SscLeviesResponse,
} from '@/types/compliance';
import { ComplianceClient } from './ComplianceClient';

export const metadata: Metadata = {
  title: 'Compliance - HomeHeroo admin',
};

async function fetchErasureRequests(token: string) {
  const url = `${getApiBaseUrl()}/v1/admin/erasure-requests?status=PENDING&pageSize=50`;
  const res = await fetch(url, {
    headers: { Cookie: `hs_access=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`erasure-requests ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as ErasureRequestsResponse;
  return json.items;
}

async function fetchSscLevies(token: string) {
  const url = `${getApiBaseUrl()}/v1/admin/compliance/ssc-levy?pageSize=50`;
  const res = await fetch(url, {
    headers: { Cookie: `hs_access=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ssc-levy ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as SscLeviesResponse;
  return json.levies;
}

export default async function CompliancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';

  // Promise.allSettled so one failed endpoint does not crash the whole page —
  // each section degrades independently. handleAdminFetchError is no longer
  // used here; the inline error message bubbles up to ComplianceClient so the
  // operator can see exactly which endpoint failed and why (4xx body included).
  void handleAdminFetchError; // kept import-stable for other callers
  const [erasureResult, sscResult] = await Promise.allSettled([
    fetchErasureRequests(token),
    fetchSscLevies(token),
  ]);

  const erasureRequests = erasureResult.status === 'fulfilled' ? erasureResult.value : [];
  const sscLevies = sscResult.status === 'fulfilled' ? sscResult.value : [];
  const erasureError =
    erasureResult.status === 'rejected'
      ? (erasureResult.reason instanceof Error ? erasureResult.reason.message : String(erasureResult.reason))
      : null;
  const sscError =
    sscResult.status === 'rejected'
      ? (sscResult.reason instanceof Error ? sscResult.reason.message : String(sscResult.reason))
      : null;

  return (
    <ComplianceClient
      initialErasureRequests={erasureRequests}
      initialSscLevies={sscLevies}
      erasureError={erasureError}
      sscError={sscError}
    />
  );
}
