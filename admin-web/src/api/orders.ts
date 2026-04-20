import type {
  Order,
  OrderListResponse,
  OrdersQueryParams,
  ReassignRequest,
  CompleteRequest,
  RefundRequest,
  WaiveFeeRequest,
  EscalateRequest,
  NoteRequest,
} from '@/types/order';

function buildSearchParams(params: OrdersQueryParams): URLSearchParams {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      sp.set(k, String(v));
    }
  });
  return sp;
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export async function fetchOrders(params: OrdersQueryParams = {}): Promise<OrderListResponse> {
  const sp = buildSearchParams(params);
  const res = await fetch(`${BASE}/api/v1/admin/orders?${sp}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`fetchOrders failed: ${res.status}`);
  return res.json() as Promise<OrderListResponse>;
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(`${BASE}/api/v1/admin/orders/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`fetchOrderById failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function fetchAllOrdersForExport(params: OrdersQueryParams): Promise<Order[]> {
  const allOrders: Order[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await fetchOrders({ ...params, page, pageSize: 10000 });
    allOrders.push(...data.items);
    totalPages = data.totalPages;
    page++;
  } while (page <= totalPages);
  return allOrders;
}

export async function reassignOrder(id: string, body: ReassignRequest): Promise<Order> {
  const res = await fetch(`${BASE}/api/v1/admin/orders/${id}/reassign`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`reassignOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function completeOrder(id: string, body: CompleteRequest): Promise<Order> {
  const res = await fetch(`${BASE}/api/v1/admin/orders/${id}/complete`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`completeOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function refundOrder(id: string, body: RefundRequest): Promise<Order> {
  const res = await fetch(`${BASE}/api/v1/admin/orders/${id}/refund`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`refundOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function waiveFeeOrder(id: string, body: WaiveFeeRequest): Promise<Order> {
  const res = await fetch(`${BASE}/api/v1/admin/orders/${id}/waive-fee`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`waiveFeeOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function escalateOrder(id: string, body: EscalateRequest): Promise<Order> {
  const res = await fetch(`${BASE}/api/v1/admin/orders/${id}/escalate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`escalateOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function addOrderNote(id: string, body: NoteRequest): Promise<Order> {
  const res = await fetch(`${BASE}/api/v1/admin/orders/${id}/note`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`addOrderNote failed: ${res.status}`);
  return res.json() as Promise<Order>;
}
