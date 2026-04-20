import { cookies } from 'next/headers';
import { createApiClient } from '@/api/client';

export async function getServerApiClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';

  const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';

  return createApiClient({
    baseUrl,
    headers: () => ({
      Authorization: `Bearer ${token}`,
    }),
  });
}
