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
  recordRemittance,
} from '../../src/api/commissions';

beforeEach(() => {
  GET.mockReset();
  POST.mockReset();
  PUT.mockReset();
  DELETE.mockReset();
});

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
});
