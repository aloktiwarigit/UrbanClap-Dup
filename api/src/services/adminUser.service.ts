import { getCosmosClient, DB_NAME } from '../cosmos/client.js';
import type { AdminRole } from '../types/admin.js';

export interface AdminUser {
  id: string;
  adminId: string;
  email: string;
  role: AdminRole;
  displayName?: string;
  totpEnrolled: boolean;
  totpSecret: string | null;
  totpSecretPending: string | null;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
}

const CONTAINER = 'admin_users';

function container() {
  return getCosmosClient().database(DB_NAME).container(CONTAINER);
}

export async function getAdminUserById(adminId: string): Promise<AdminUser | null> {
  const { resource } = await container().item(adminId, adminId).read<AdminUser>();
  return resource ?? null;
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const { resources } = await container()
    .items.query<AdminUser>({
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email }],
    })
    .fetchAll();
  return resources[0] ?? null;
}

export async function updateAdminUser(
  adminId: string,
  patch: Partial<
    Pick<
      AdminUser,
      | 'totpSecret'
      | 'totpSecretPending'
      | 'totpEnrolled'
      | 'deactivatedAt'
      | 'role'
      | 'displayName'
    >
  >,
): Promise<void> {
  const existing = await getAdminUserById(adminId);
  if (!existing) throw new Error(`AdminUser ${adminId} not found`);
  await container()
    .item(adminId, adminId)
    .replace({ ...existing, ...patch, updatedAt: new Date().toISOString() });
}

export async function createAdminUser(user: AdminUser): Promise<void> {
  await container().items.create(user);
}
