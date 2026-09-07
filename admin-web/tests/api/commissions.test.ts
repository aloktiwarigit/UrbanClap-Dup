import { describe, it, expect, vi, beforeEach } from 'vitest';

const GET = vi.fn();
const POST = vi.fn();
const PUT = vi.fn();
const DELETE = vi.fn();

vi.mock('@/api/client', () => {
  class ApiError extends Error {
    readonly status: number;
    readonly url: string;
    readonly method: string;
    readonly body: unknown;

    constructor(args: { status: number; url: string; method: string; body: unknown }) {
      super(`API ${args.method} ${args.url} → ${args.status}`);
      this.name = 'ApiError';
      this.status = args.status;
      this.url = args.url;
      this.method = args.method;
      this.body = args.body;
    }
  }

  return {
    createApiClient: () => ({ GET, POST, PUT, DELETE }),
    ApiError,
  };
});

import {
  fetchCommissionDashboard,
  fetchTechnicianLedger,
  recordRemittance,
  recomputeAllHolds,
  setHoldOverride,
  clearHoldOverride,
  fetchCommissionConfig,
  updateCommissionConfig,
  fetchTechnicianClientConfig,
  updateTechnicianClientConfig,
} from '../../src/api/commissions';

beforeEach(() => {
  GET.mockReset();
  POST.mockReset();
  PUT.mockReset();
  DELETE.mockReset();
});

const sampleLedgerDetail = {
  technicianId: 't1',
  hold: null,
  receivables: [],
  remittances: [],
  credits: [],
  cashCollectedPaise: 0,
  creditAppliedPaise: 0,
};

const sampleRemittanceResponse = {
  remittance: {
    id: 'rem_1',
    docType: 'REMITTANCE',
    technicianId: 't1',
    partitionKey: 't1',
    amountPaise: 10000,
    method: 'UPI',
    ref: 'r1',
    allocations: [{ bookingId: 'b1', paise: 10000 }],
    creditCreatedPaise: 0,
    recordedByAdminId: 'admin1',
    idempotencyKey: 'idem-123',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  allocations: [{ bookingId: 'b1', paise: 10000 }],
  creditCreatedPaise: 0,
  hold: null,
  holdRecomputePending: false,
  replayed: false,
};

const sampleCommissionConfig = {
  defaultCommissionBps: 2000,
  warnThresholdPaise: 100000,
  blockThresholdPaise: 500000,
  holdEnforcementEnabled: true,
  enforceKycInDispatch: true,
  updatedBy: 'admin1',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const sampleTechnicianClientConfig = {
  id: 'technician-client-config',
  features: { wallet: true },
  minSupportedVersionCode: 10,
  updatedBy: 'admin1',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('fetchCommissionDashboard', () => {
  it('fetchCommissionDashboard passes the continuation token as a query param', async () => {
    GET.mockResolvedValue({
      data: { technicians: [], totalOutstanding: 0, unreconciledTechnicianCount: 0 },
    });
    await fetchCommissionDashboard('dG9rZW4=');
    expect(GET).toHaveBeenCalledWith('/v1/admin/finance/commission-receivables', {
      params: { query: { continuationToken: 'dG9rZW4=' } },
    });
  });

  it('fetchCommissionDashboard omits the query entirely when there is no token', async () => {
    GET.mockResolvedValue({
      data: { technicians: [], totalOutstanding: 0, unreconciledTechnicianCount: 0 },
    });
    await fetchCommissionDashboard();
    expect(GET).toHaveBeenCalledWith('/v1/admin/finance/commission-receivables', {
      params: { query: {} },
    });
  });
});

describe('fetchTechnicianLedger', () => {
  it('calls GET with the technicianId path param', async () => {
    GET.mockResolvedValue({ data: sampleLedgerDetail });
    await fetchTechnicianLedger('t1');
    expect(GET).toHaveBeenCalledWith('/v1/admin/finance/commission-receivables/{technicianId}', {
      params: { path: { technicianId: 't1' } },
    });
  });

  it('resolves the CommissionLedgerDetail on success', async () => {
    GET.mockResolvedValue({ data: sampleLedgerDetail });
    const result = await fetchTechnicianLedger('t1');
    expect(result).toEqual(sampleLedgerDetail);
  });
});

describe('recordRemittance', () => {
  it('recordRemittance surfaces a 409 as a typed ApiError rather than swallowing it', async () => {
    POST.mockResolvedValue({ error: { code: 'IDEMPOTENCY_MISMATCH' }, response: { status: 409 } });
    await expect(
      recordRemittance({
        technicianId: 't1',
        amountPaise: 100,
        method: 'UPI',
        ref: 'r',
        idempotencyKey: 'k',
      }),
    ).rejects.toMatchObject({ status: 409, body: { code: 'IDEMPOTENCY_MISMATCH' } });
  });

  it('passes the idempotencyKey through to POST unchanged', async () => {
    POST.mockResolvedValue({ data: sampleRemittanceResponse });
    await recordRemittance({
      technicianId: 't1',
      amountPaise: 10000,
      method: 'UPI',
      ref: 'r1',
      idempotencyKey: 'idem-123',
    });
    // The whole point of this invariant: the fetch helper must forward the
    // caller-supplied key byte-for-byte, never regenerate it — a dropped or
    // rewritten key here would let a retried request become a second real
    // payment against the technician's ledger.
    expect(POST).toHaveBeenCalledWith('/v1/admin/finance/commission-remittances', {
      body: {
        technicianId: 't1',
        amountPaise: 10000,
        method: 'UPI',
        ref: 'r1',
        idempotencyKey: 'idem-123',
      },
    });
  });

  it('resolves the RecordRemittanceResponse on success', async () => {
    POST.mockResolvedValue({ data: sampleRemittanceResponse });
    const result = await recordRemittance({
      technicianId: 't1',
      amountPaise: 10000,
      method: 'UPI',
      ref: 'r1',
      idempotencyKey: 'idem-123',
    });
    expect(result).toEqual(sampleRemittanceResponse);
  });
});

describe('recomputeAllHolds', () => {
  it('calls POST on the recompute endpoint with no body', async () => {
    POST.mockResolvedValue({ data: { queued: true } });
    await recomputeAllHolds();
    expect(POST).toHaveBeenCalledWith('/v1/admin/finance/commission-receivables/recompute');
  });
});

describe('setHoldOverride', () => {
  it('calls POST with the technicianId path param and the override body', async () => {
    POST.mockResolvedValue({ data: { hold: null } });
    await setHoldOverride('t1', { until: '2026-12-31T00:00:00.000Z', reason: 'manual override' });
    expect(POST).toHaveBeenCalledWith(
      '/v1/admin/finance/commission-hold/{technicianId}/override',
      {
        params: { path: { technicianId: 't1' } },
        body: { until: '2026-12-31T00:00:00.000Z', reason: 'manual override' },
      },
    );
  });
});

describe('clearHoldOverride', () => {
  it('calls DELETE with the technicianId path param', async () => {
    DELETE.mockResolvedValue({ data: { hold: null } });
    await clearHoldOverride('t1');
    expect(DELETE).toHaveBeenCalledWith(
      '/v1/admin/finance/commission-hold/{technicianId}/override',
      { params: { path: { technicianId: 't1' } } },
    );
  });

  it('surfaces a not-found error as a typed ApiError', async () => {
    DELETE.mockResolvedValue({ error: { code: 'TECHNICIAN_NOT_FOUND' }, response: { status: 404 } });
    await expect(clearHoldOverride('missing-tech')).rejects.toMatchObject({
      status: 404,
      body: { code: 'TECHNICIAN_NOT_FOUND' },
    });
  });
});

describe('fetchCommissionConfig', () => {
  it('calls GET on the commission-config endpoint', async () => {
    GET.mockResolvedValue({ data: sampleCommissionConfig });
    await fetchCommissionConfig();
    expect(GET).toHaveBeenCalledWith('/v1/admin/catalogue/commission-config');
  });
});

describe('updateCommissionConfig', () => {
  it('calls PUT with the patch body', async () => {
    PUT.mockResolvedValue({ data: sampleCommissionConfig });
    await updateCommissionConfig({ defaultCommissionBps: 2000 });
    expect(PUT).toHaveBeenCalledWith('/v1/admin/catalogue/commission-config', {
      body: { defaultCommissionBps: 2000 },
    });
  });

  it('surfaces a validation error as a typed ApiError', async () => {
    PUT.mockResolvedValue({ error: { code: 'VALIDATION_ERROR' }, response: { status: 400 } });
    await expect(updateCommissionConfig({ defaultCommissionBps: 5000 })).rejects.toMatchObject({
      status: 400,
      body: { code: 'VALIDATION_ERROR' },
    });
  });
});

describe('fetchTechnicianClientConfig', () => {
  it('calls GET on the technician-client config endpoint', async () => {
    GET.mockResolvedValue({ data: sampleTechnicianClientConfig });
    await fetchTechnicianClientConfig();
    expect(GET).toHaveBeenCalledWith('/v1/admin/config/technician-client');
  });
});

describe('updateTechnicianClientConfig', () => {
  it('calls PUT with the patch body', async () => {
    PUT.mockResolvedValue({ data: sampleTechnicianClientConfig });
    await updateTechnicianClientConfig({ minSupportedVersionCode: 42 });
    expect(PUT).toHaveBeenCalledWith('/v1/admin/config/technician-client', {
      body: { minSupportedVersionCode: 42 },
    });
  });
});
