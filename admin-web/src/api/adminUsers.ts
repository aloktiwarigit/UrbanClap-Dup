import { apiUrl } from './base';
import type { AdminUserListItem, PatchAdminUserBody } from '@/types/admin-user';

export async function patchAdminUser(
  adminId: string,
  body: PatchAdminUserBody,
): Promise<void> {
  const res = await fetch(apiUrl(`/v1/admin/users/${adminId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Patch admin user ${res.status}`);
}

export async function fetchAdminUsers(): Promise<AdminUserListItem[]> {
  const res = await fetch(apiUrl('/v1/admin/users'), { credentials: 'include' });
  if (!res.ok) throw new Error(`Admin users ${res.status}`);
  const json = (await res.json()) as { users: AdminUserListItem[] };
  return json.users;
}
