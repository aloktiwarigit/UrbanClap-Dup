import type { Order, OrderListResponse, OrdersQueryParams } from '@/types/order';

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
