export type OrderStatus =
  | 'SEARCHING' | 'ASSIGNED' | 'EN_ROUTE' | 'REACHED'
  | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PAID';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  technicianId?: string;
  technicianName?: string;
  serviceId?: string;
  serviceName?: string;
  categoryId?: string;
  status: OrderStatus;
  city: string;
  scheduledAt: string;
  amount: number;
  createdAt: string;
  _ts?: number;
  feesWaived?: boolean;
  escalated?: boolean;
  internalNotes?: string[];
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReassignRequest { technicianId: string; reason: string; }
export interface CompleteRequest { reason: string; }
export interface RefundRequest { reason: string; amountPaise?: number; }
export interface WaiveFeeRequest { reason: string; }
export interface EscalateRequest { reason: string; priority: 'HIGH' | 'CRITICAL'; }
export interface NoteRequest { note: string; }

export interface OrdersQueryParams {
  status?: string;
  city?: string;
  categoryId?: string;
  technicianId?: string;
  customerPhone?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  page?: number;
  pageSize?: number;
}
