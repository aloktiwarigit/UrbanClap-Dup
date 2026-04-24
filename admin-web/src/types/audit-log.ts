export type AdminRole = 'super-admin' | 'ops-manager' | 'finance' | 'support-agent';

export interface AuditLogEntry {
  id: string;
  adminId: string;
  role: AdminRole;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditLogListResponse {
  entries: AuditLogEntry[];
  continuationToken?: string;
}

export interface AuditLogFiltersState {
  adminId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_FILTERS: AuditLogFiltersState = {
  adminId: '',
  action: '',
  resourceType: '',
  resourceId: '',
  dateFrom: '',
  dateTo: '',
};
