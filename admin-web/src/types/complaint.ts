export type ComplaintStatus = 'NEW' | 'INVESTIGATING' | 'RESOLVED';

export type ComplaintResolutionCategory =
  | 'TECHNICIAN_MISCONDUCT'
  | 'SERVICE_QUALITY'
  | 'BILLING_DISPUTE'
  | 'LATE_ARRIVAL'
  | 'NO_SHOW'
  | 'OTHER';

export interface InternalNote {
  adminId: string;
  note: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  orderId: string;
  customerId: string;
  technicianId: string;
  description: string;
  status: ComplaintStatus;
  assigneeAdminId?: string;
  resolutionCategory?: ComplaintResolutionCategory;
  internalNotes: InternalNote[];
  slaDeadlineAt: string; // ISO
  escalated: boolean;
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
