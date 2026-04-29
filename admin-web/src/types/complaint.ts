export type ComplaintStatus = 'NEW' | 'INVESTIGATING' | 'RESOLVED';

export type ComplaintResolutionCategory =
  | 'TECHNICIAN_MISCONDUCT'
  | 'SERVICE_QUALITY'
  | 'BILLING_DISPUTE'
  | 'LATE_ARRIVAL'
  | 'NO_SHOW'
  | 'OTHER'
  | 'APPEAL_UPHELD'
  | 'APPEAL_REMOVED'
  | 'APPEAL_PARTIAL_REMOVE';

export interface InternalNote {
  adminId: string;
  note: string;
  createdAt: string;
}

export type ComplaintType =
  | 'STANDARD'
  | 'RATING_SHIELD'
  | 'ABUSIVE_CUSTOMER_SHIELD'
  | 'RATING_APPEAL';

export interface Complaint {
  id: string;
  orderId: string;
  customerId: string;
  technicianId: string;
  description: string;
  type: ComplaintType;
  status: ComplaintStatus;
  assigneeAdminId?: string;
  resolutionCategory?: ComplaintResolutionCategory;
  internalNotes: InternalNote[];
  slaDeadlineAt: string;
  escalated: boolean;
  evidenceUrls?: string[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintListResponse {
  items: Complaint[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RepeatOffender {
  technicianId: string;
  count: number;
}
