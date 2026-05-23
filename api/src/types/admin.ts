export type AdminRole =
  | 'super-admin'
  | 'ops-manager'
  | 'finance'
  | 'support-agent'
  | 'system';

export function normalizeAdminRole(role: unknown): AdminRole | null {
  if (role === 'admin') return 'super-admin';
  if (
    role === 'super-admin' ||
    role === 'ops-manager' ||
    role === 'finance' ||
    role === 'support-agent' ||
    role === 'system'
  ) {
    return role;
  }
  return null;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOTP_SETUP'
  | 'ORDER_OVERRIDE'
  | 'TECH_DEACTIVATE'
  | 'REFUND_APPROVE'
  | 'PAYOUT_APPROVE'
  | 'COMPLAINT_RESOLVE'
  | 'CATALOGUE_EDIT'
  | 'ADMIN_USER_CHANGE'
  | 'SSC_LEVY_TRANSFER'
  | 'ROUTE_TRANSFER_ATTEMPT'
  | 'ROUTE_TRANSFER_SUCCESS'
  | 'ROUTE_TRANSFER_FAILED'
  | 'RECON_RETRY_ATTEMPT'
  | 'RECON_RETRY_SUCCESS'
  | 'RECON_RETRY_FAILED'
  | 'RECON_MISMATCH_ALERT';

export interface AdminContext {
  adminId: string;
  role: AdminRole;
  sessionId: string;
}
