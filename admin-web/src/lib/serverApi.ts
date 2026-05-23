import { cookies } from 'next/headers';
import { createApiClient } from '@/api/client';
import { getApiBaseUrl } from '@/lib/apiBase';

export async function getServerApiClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';

  const baseUrl = getApiBaseUrl();

  return createApiClient({
    baseUrl,
    disableRefresh: true,
    // requireAdmin middleware reads hs_access from the Cookie header, not Authorization
    headers: () => ({
      Cookie: `hs_access=${token}`,
    }),
  });
}
