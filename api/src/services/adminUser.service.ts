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
const INVITE_PREFIX = 'invite:';

function container() {
  return getCosmosClient().database(DB_NAME).container(CONTAINER);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getAdminInviteId(email: string): string {
  return `${INVITE_PREFIX}${normalizeEmail(email)}`;
}

export function isAdminInvite(user: AdminUser): boolean {
  return user.adminId.startsWith(INVITE_PREFIX);
}

export async function getAdminUserById(adminId: string): Promise<AdminUser | null> {
  const { resource } = await container().item(adminId, adminId).read<AdminUser>();
  return resource ?? null;
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const { resources } = await container()
    .items.query<AdminUser>({
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: normalizeEmail(email) }],
    })
    .fetchAll();
  return resources[0] ?? null;
}

export async function claimAdminInvite(invite: AdminUser, firebaseUid: string, email: string): Promise<AdminUser> {
  if (!isAdminInvite(invite)) throw new Error(`AdminUser ${invite.adminId} is not an invite`);

  const now = new Date().toISOString();
  const claimed: AdminUser = {
    ...invite,
    id: firebaseUid,
    adminId: firebaseUid,
    email: normalizeEmail(email),
    totpEnrolled: false,
    totpSecret: null,
    totpSecretPending: null,
    deactivatedAt: null,
    updatedAt: now,
  };

  await container().items.create(claimed);
  await container().item(invite.id, invite.adminId).delete();
  return claimed;
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
