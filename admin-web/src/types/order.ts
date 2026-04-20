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
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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
