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
  TechnicianCandidate,
  RevealParty,
  RevealContactResponse,
} from '@/types/order';
import { apiUrl } from './base';

function buildSearchParams(params: OrdersQueryParams): URLSearchParams {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      sp.set(k, String(v));
    }
  });
  return sp;
}

export async function fetchOrders(params: OrdersQueryParams = {}): Promise<OrderListResponse> {
  const sp = buildSearchParams(params);
  const res = await fetch(apiUrl(`/v1/admin/orders?${sp}`), { credentials: 'include' });
  if (!res.ok) throw new Error(`fetchOrders failed: ${res.status}`);
  return res.json() as Promise<OrderListResponse>;
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}`), { credentials: 'include' });
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
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}/reassign`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`reassignOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function completeOrder(id: string, body: CompleteRequest): Promise<Order> {
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}/complete`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`completeOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function refundOrder(id: string, body: RefundRequest): Promise<Order> {
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}/refund`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`refundOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function waiveFeeOrder(id: string, body: WaiveFeeRequest): Promise<Order> {
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}/waive-fee`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`waiveFeeOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function escalateOrder(id: string, body: EscalateRequest): Promise<Order> {
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}/escalate`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`escalateOrder failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function addOrderNote(id: string, body: NoteRequest): Promise<Order> {
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}/note`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`addOrderNote failed: ${res.status}`);
  return res.json() as Promise<Order>;
}

export async function fetchTechnicianCandidatesForOrder(id: string): Promise<TechnicianCandidate[]> {
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}/technician-candidates`), {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`fetchTechnicianCandidatesForOrder failed: ${res.status}`);
  const json = (await res.json()) as { technicians?: TechnicianCandidate[] };
  return json.technicians ?? [];
}

/** Error thrown by revealOrderContact, carrying the HTTP status so the UI can
 *  distinguish forbidden (403) from rate-limited (429) from everything else.
 *
 *  Codex round 3, Finding 2: a 429 can mean either the per-minute cap
 *  (`code: 'RATE_LIMITED'`) or the rolling-24h daily cap
 *  (`code: 'RATE_LIMITED_DAILY'`) — telling the admin "try again in a
 *  minute" when the real wait is hours is a real usability bug. `code` and
 *  `retryAfterMs` carry the response body through so the UI can tell them
 *  apart; both are `undefined` when the body could not be read (see
 *  `parseErrorBody` below). */
export class RevealContactError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly retryAfterMs: number | undefined;
  constructor(status: number, code?: string, retryAfterMs?: number) {
    super(`revealOrderContact failed: ${status}`);
    this.name = 'RevealContactError';
    this.status = status;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Reads the JSON error body defensively. The body may be absent (e.g. a 403
 * with no payload) or unparseable (e.g. a proxy/gateway error page that
 * returns HTML with a 429 status), so a parse failure must fall back to
 * `undefined` fields rather than throwing a second error out of the error
 * path and masking the original HTTP status.
 */
async function parseErrorBody(res: Response): Promise<{ code: string | undefined; retryAfterMs: number | undefined }> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === 'object') {
      const { code, retryAfterMs } = body as { code?: unknown; retryAfterMs?: unknown };
      return {
        code: typeof code === 'string' ? code : undefined,
        retryAfterMs: typeof retryAfterMs === 'number' ? retryAfterMs : undefined,
      };
    }
    return { code: undefined, retryAfterMs: undefined };
  } catch {
    return { code: undefined, retryAfterMs: undefined };
  }
}

export async function revealOrderContact(
  id: string,
  party: RevealParty,
): Promise<RevealContactResponse> {
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}/reveal-contact`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ party }),
  });
  if (!res.ok) {
    const { code, retryAfterMs } = await parseErrorBody(res);
    throw new RevealContactError(res.status, code, retryAfterMs);
  }
  return res.json() as Promise<RevealContactResponse>;
}
