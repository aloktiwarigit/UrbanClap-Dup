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
  const res = await fetch(`${getApiBaseUrl()}/v1/admin/erasure-requests?status=PENDING&pageSize=50`, {
    headers: { Cookie: `hs_access=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) handleAdminFetchError(res, 'Erasure requests');
  const json = (await res.json()) as ErasureRequestsResponse;
  return json.items;
}

async function fetchSscLevies(token: string) {
  const res = await fetch(`${getApiBaseUrl()}/v1/admin/compliance/ssc-levy?pageSize=50`, {
    headers: { Cookie: `hs_access=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) handleAdminFetchError(res, 'SSC levy requests');
  const json = (await res.json()) as SscLeviesResponse;
  return json.levies;
}

export default async function CompliancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';

  const [erasureRequests, sscLevies] = await Promise.all([
    fetchErasureRequests(token),
    fetchSscLevies(token),
  ]);

  return (
    <ComplianceClient
      initialErasureRequests={erasureRequests}
      initialSscLevies={sscLevies}
    />
  );
}
