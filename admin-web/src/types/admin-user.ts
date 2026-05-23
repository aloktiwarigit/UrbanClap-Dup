import type { AdminRole } from '@/lib/auth/types';

export interface AdminUserListItem {
  adminId: string;
  email: string;
  role: AdminRole;
  displayName?: string;
  totpEnrolled: boolean;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
}

export interface AdminUsersResponse {
  users: AdminUserListItem[];
}

export interface PatchAdminUserBody {
  role?: AdminRole;
  displayName?: string;
  deactivatedAt?: string | null;
}
