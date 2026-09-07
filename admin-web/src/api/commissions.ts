import { createApiClient, ApiError, type ApiClient } from './client';
import { BROWSER_API_BASE_URL } from './base';
import type { components, operations } from './generated/schema';

// Lazy singleton — created on first call, reused so the 401-refresh
// middleware in createApiClient can track in-flight refreshes across calls.
let _browserClient: ApiClient | undefined;
function getBrowserClient(): ApiClient {
  if (_browserClient === undefined) {
    _browserClient = createApiClient({ baseUrl: BROWSER_API_BASE_URL, credentials: 'include' });
  }
  return _browserClient;
}

// Re-exported types from the generated schema — never hand-tighten these.
export type CommissionDashboard = components['schemas']['CommissionReceivablesDashboardV2'];
export type CommissionDashboardRow = components['schemas']['CommissionDashboardTechnicianEntry'];
export type CommissionLedgerDetail = components['schemas']['CommissionLedgerDetail'];
export type RecordRemittanceResponse = components['schemas']['RecordRemittanceResponse'];
export type CommissionHoldResponse = components['schemas']['CommissionHoldResponse'];

// The catalogue commission-config and technician-client-config endpoints have
// no named component schema in the OpenAPI doc — their shape is inlined on
// the operation, so it is pulled from `operations` instead of `components`.
export type CommissionConfig =
  operations['getAdminCommissionConfig']['responses'][200]['content']['application/json'];
export type UpdateCommissionConfigParams = NonNullable<
  operations['putAdminCommissionConfig']['requestBody']
>['content']['application/json'];

export type TechnicianClientConfig =
  operations['getTechnicianClientConfig']['responses'][200]['content']['application/json'];
export type UpdateTechnicianClientConfigParams = NonNullable<
  operations['putTechnicianClientConfig']['requestBody']
>['content']['application/json'];

export interface RecordRemittanceParams {
  technicianId: string;
  amountPaise: number;
  method: 'UPI' | 'CASH_DEPOSIT';
  ref: string;
  note?: string;
  // Caller-supplied. Never generated in here — a key minted inside the fetch
  // helper would change on every retry and defeat the server's idempotency
  // check, risking a double payment on a retried request.
  idempotencyKey: string;
}

export interface HoldOverrideParams {
  until: string;
  reason: string;
}

interface RawClientResult<T> {
  data?: T;
  error?: unknown;
  response?: { status: number; url?: string };
}

function unwrap<T>(result: RawClientResult<T>, method: string): T {
  if (result.error !== undefined) {
    throw new ApiError({
      status: result.response?.status ?? 0,
      url: result.response?.url ?? '',
      method,
      body: result.error,
    });
  }
  if (result.data === undefined) {
    throw new ApiError({
      status: result.response?.status ?? 0,
      url: result.response?.url ?? '',
      method,
      body: null,
    });
  }
  return result.data;
}

export async function fetchCommissionDashboard(
  continuationToken?: string,
): Promise<CommissionDashboard> {
  const query = continuationToken !== undefined ? { continuationToken } : {};
  const result = await getBrowserClient().GET('/v1/admin/finance/commission-receivables', {
    params: { query },
  });
  return unwrap(result, 'GET');
}

export async function fetchTechnicianLedger(
  technicianId: string,
): Promise<CommissionLedgerDetail> {
  const result = await getBrowserClient().GET(
    '/v1/admin/finance/commission-receivables/{technicianId}',
    { params: { path: { technicianId } } },
  );
  return unwrap(result, 'GET');
}

export async function recordRemittance(
  body: RecordRemittanceParams,
): Promise<RecordRemittanceResponse> {
  const result = await getBrowserClient().POST('/v1/admin/finance/commission-remittances', {
    body,
  });
  return unwrap(result, 'POST');
}

export async function recomputeAllHolds(): Promise<void> {
  const result = await getBrowserClient().POST(
    '/v1/admin/finance/commission-receivables/recompute',
  );
  unwrap(result, 'POST');
}

export async function setHoldOverride(
  technicianId: string,
  params: HoldOverrideParams,
): Promise<void> {
  const result = await getBrowserClient().POST(
    '/v1/admin/finance/commission-hold/{technicianId}/override',
    { params: { path: { technicianId } }, body: params },
  );
  unwrap(result, 'POST');
}

export async function clearHoldOverride(technicianId: string): Promise<void> {
  const result = await getBrowserClient().DELETE(
    '/v1/admin/finance/commission-hold/{technicianId}/override',
    { params: { path: { technicianId } } },
  );
  unwrap(result, 'DELETE');
}

export async function fetchCommissionConfig(): Promise<CommissionConfig> {
  const result = await getBrowserClient().GET('/v1/admin/catalogue/commission-config');
  return unwrap(result, 'GET');
}

export async function updateCommissionConfig(
  patch: UpdateCommissionConfigParams,
): Promise<CommissionConfig> {
  const result = await getBrowserClient().PUT('/v1/admin/catalogue/commission-config', {
    body: patch,
  });
  return unwrap(result, 'PUT');
}

export async function fetchTechnicianClientConfig(): Promise<TechnicianClientConfig> {
  const result = await getBrowserClient().GET('/v1/admin/config/technician-client');
  return unwrap(result, 'GET');
}

export async function updateTechnicianClientConfig(
  patch: UpdateTechnicianClientConfigParams,
): Promise<TechnicianClientConfig> {
  const result = await getBrowserClient().PUT('/v1/admin/config/technician-client', {
    body: patch,
  });
  return unwrap(result, 'PUT');
}
