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
  // Admin auth (lowercase w/ dots for API compatibility)
  | 'admin.login'
  | 'admin.logout'
  | 'admin.totp_setup'
  // Admin operations
  | 'ADMIN_LOGIN_FAILED'
  | 'ADMIN_USER_CHANGE'
  // Booking & commission lifecycle
  | 'BOOKING_UNFULFILLED'
  | 'CASH_COLLECTION_RECORDED'
  | 'COMMISSION_CONFIG_UPDATED'
  | 'COMMISSION_DUE_RECORDED'
  | 'COMMISSION_HOLD_OVERRIDDEN'
  | 'COMMISSION_HOLD_OVERRIDE_CLEARED'
  | 'COMMISSION_HOLD_RECOMPUTE_REQUESTED'
  | 'COMMISSION_REMITTANCE_RECORDED'
  | 'COMMISSION_REMITTED'
  | 'COMMISSION_WAIVED'
  // Catalogue & configuration
  | 'CATALOGUE_CATEGORY_CREATED'
  | 'CATALOGUE_CATEGORY_TOGGLED'
  | 'CATALOGUE_CATEGORY_UPDATED'
  | 'CATALOGUE_EDIT'
  | 'CATALOGUE_SERVICE_CREATED'
  | 'CATALOGUE_SERVICE_TOGGLED'
  | 'CATALOGUE_SERVICE_UPDATED'
  | 'TECHNICIAN_CLIENT_CONFIG_UPDATED'
  // Complaints & appeals
  | 'ADD_NOTE'
  | 'APPEAL_DECIDED'
  | 'COMPLAINT_ASSIGNED'
  | 'COMPLAINT_CREATED'
  | 'COMPLAINT_STATUS_CHANGED'
  // Customer & payment
  | 'COMPLETE'
  | 'CUSTOMER_CONFIRMED_PAYMENT'
  | 'ESCALATE'
  | 'ORDER_OVERRIDE'
  | 'REASSIGN'
  | 'REFUND'
  | 'WAIVE_FEE'
  | 'WALLET_CREDIT_APPLIED_ON_PAYMENT'
  // Erasure
  | 'ERASURE_DENIED'
  | 'ERASURE_EXECUTED'
  | 'ERASURE_FAILED'
  | 'ERASURE_REQUESTED'
  | 'ERASURE_REVOKED'
  // Finance & payout
  | 'PAYOUT_APPROVE'
  | 'PAYMENT_CAPTURED'
  | 'REFUND_APPROVE'
  // Reconciliation
  | 'RECON_MISMATCH_ALERT'
  | 'RECON_RETRY_ATTEMPT'
  | 'RECON_RETRY_FAILED'
  | 'RECON_RETRY_SUCCESS'
  // Rating & support
  | 'RATING_SHIELD_ESCALATED'
  // Route & settlement
  | 'ROUTE_TRANSFER_ATTEMPT'
  | 'ROUTE_TRANSFER_FAILED'
  | 'ROUTE_TRANSFER_INSTANT'
  | 'ROUTE_TRANSFER_NEXT_DAY'
  | 'ROUTE_TRANSFER_SUCCESS'
  | 'SETTLEMENT_HELD_NEXT_DAY'
  | 'SETTLEMENT_HELD_WEEKLY'
  // SOS
  | 'SOS_KEY_UPLOADED'
  | 'SOS_PLAYBACK_TOKEN_ISSUED'
  | 'SOS_TRIGGERED'
  // SSC & compliance
  | 'SSC_LEVY_TRANSFER'
  // Support
  | 'NO_SHOW_CREDIT_ISSUED'
  | 'NO_SHOW_REDISPATCH_INITIATED'
  | 'TECH_DEACTIVATE';

export interface AdminContext {
  adminId: string;
  role: AdminRole;
  sessionId: string;
}
