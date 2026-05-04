export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getApiBaseUrl } from '@/lib/apiBase';
import { handleAdminFetchError } from '@/lib/serverFetch';
import type { AdminUsersResponse } from '@/types/admin-user';
import { AdminUsersClient } from './AdminUsersClient';

export const metadata: Metadata = {
  title: 'Admin Users - HomeHeroo admin',
};

async function fetchAdminUsers(token: string): Promise<AdminUsersResponse['users']> {
  const res = await fetch(`${getApiBaseUrl()}/v1/admin/users`, {
    headers: { Cookie: `hs_access=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) handleAdminFetchError(res, 'Admin users');
  const json = (await res.json()) as AdminUsersResponse;
  return json.users;
}

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';
  const users = await fetchAdminUsers(token);

  return <AdminUsersClient initialUsers={users} />;
}
