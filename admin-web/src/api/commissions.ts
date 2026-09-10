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

// The catalogue category document. Used by the settings page's per-category rate table
// (E21-S03 task 9) — categories are catalogue data, not commission data, but the only field
// this app ever edits on them (`commissionBps`) is a rate, so its client functions live here
// alongside the other rate-editing calls rather than in a new module for two functions.
export type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

// Same rationale as `AdminServiceCategory` above: the catalogue service document, used only for
// the one field this app edits on it (`commissionBps`) via `updateServiceCommission` below.
export type AdminService = components['schemas']['AdminService'];

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

// Categories list has no query params and no pagination on this endpoint (P0-3 era catalogue —
// small, hand-curated roster). Returns the flat array, not the `{ categories }` envelope, so
// callers never have to unwrap it themselves.
export async function fetchAdminCategories(): Promise<AdminServiceCategory[]> {
  const result = await getBrowserClient().GET('/v1/admin/catalogue/categories');
  const data = unwrap(result, 'GET');
  return data.categories;
}

// Services list, including inactive ones. Only the commission-settings service-overrides roster
// (issue #334, WS-B/task 8) needs `includeInactive` — a service that had an override set before
// being deactivated must still show up so the operator can see/clear it — so it's hard-coded true
// here rather than exposed as a parameter; every other prospective caller of this endpoint would
// want the default active-only behavior and should keep calling the handler directly with no
// query param (or add its own fetch function) rather than reuse this one.
export async function fetchAdminServices(): Promise<AdminService[]> {
  const result = await getBrowserClient().GET('/v1/admin/catalogue/services', {
    params: { query: { includeInactive: true } },
  });
  const data = unwrap(result, 'GET');
  return data.services;
}

/**
 * Sets, changes, or clears a category's commission-rate override.
 *
 * `commissionBps: null` clears the override so the category goes back to inheriting the global
 * default (`CommissionConfig.defaultCommissionBps`) — see the doc comment on
 * `UpdateCategoryBodySchema` in the API for why `null` (not omission) is the wire value that
 * means "remove this key". A number sets/replaces the override; the 1500–3500 range is the same
 * one `updateCommissionConfig`'s `defaultCommissionBps` enforces, and the API 400s outside it.
 */
export async function updateCategoryCommission(
  categoryId: string,
  commissionBps: number | null,
): Promise<AdminServiceCategory> {
  const result = await getBrowserClient().PUT('/v1/admin/catalogue/categories/{id}', {
    params: { path: { id: categoryId } },
    body: { commissionBps },
  });
  return unwrap(result, 'PUT');
}

/**
 * Sets, changes, or clears a service's commission-rate override.
 *
 * Mirrors `updateCategoryCommission` above: `commissionBps: null` clears the override so the
 * service goes back to inheriting its category's rate (or the global default if the category
 * has none). A number sets/replaces the override.
 */
export async function updateServiceCommission(
  serviceId: string,
  commissionBps: number | null,
): Promise<AdminService> {
  const result = await getBrowserClient().PUT('/v1/admin/catalogue/services/{id}', {
    params: { path: { id: serviceId } },
    body: { commissionBps },
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
