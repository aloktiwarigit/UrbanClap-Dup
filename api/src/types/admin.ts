export type AdminRole = 'super-admin' | 'ops-manager' | 'finance' | 'support-agent';

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
  | 'SSC_LEVY_TRANSFER';

export interface AdminContext {
  adminId: string;
  role: AdminRole;
  sessionId: string;
}
