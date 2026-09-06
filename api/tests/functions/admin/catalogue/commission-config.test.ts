import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/commission-config-repository.js');
vi.mock('../../../../src/cosmos/system-docs-repository.js');
vi.mock('../../../../src/services/commission-config.service.js');
vi.mock('../../../../src/services/auditLog.service.js');

import { commissionConfigRepo } from '../../../../src/cosmos/commission-config-repository.js';
import { systemDocsRepo } from '../../../../src/cosmos/system-docs-repository.js';
import * as configSvc from '../../../../src/services/commission-config.service.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';
import {
  getAdminCommissionConfigHandler,
  putAdminCommissionConfigHandler,
} from '../../../../src/functions/admin/catalogue/commission-config.js';

const superAdminCtx = { adminId: 'admin-1', role: 'super-admin' as const, sessionId: 's1' };
const financeAdmin = { adminId: 'admin-2', role: 'finance' as const, sessionId: 's2' };

const effectiveConfig = {
  defaultCommissionBps: 2200,
  warnThresholdPaise: 250000,
  blockThresholdPaise: 500000,
  holdEnforcementEnabled: false,
  enforceKycInDispatch: false,
  updatedBy: 'admin-1',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

function makePutReq(body: unknown): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/catalogue/commission-config',
    method: 'PUT',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => vi.clearAllMocks());

describe('getAdminCommissionConfigHandler', () => {
  const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/catalogue/commission-config', method: 'GET' });

  it('returns the effective config', async () => {
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveConfig);

    const res = (await getAdminCommissionConfigHandler(req, {} as never, superAdminCtx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { defaultCommissionBps: number }).defaultCommissionBps).toBe(2200);
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(configSvc.getCommissionConfig).mockRejectedValue(new Error('timeout'));

    const res = (await getAdminCommissionConfigHandler(req, {} as never, superAdminCtx)) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});

describe('putAdminCommissionConfigHandler', () => {
  it('updates config and busts the in-process cache', async () => {
    vi.mocked(commissionConfigRepo.patchCommissionConfig).mockResolvedValue({
      id: 'commission-config',
      defaultCommissionBps: 2500,
      updatedBy: 'admin-1',
      updatedAt: '2026-05-01T00:00:00.000Z',
    });

    const res = (await putAdminCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 2500 }),
      {} as never,
      superAdminCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { defaultCommissionBps: number }).defaultCommissionBps).toBe(2500);
    expect(configSvc._resetCommissionConfigCacheForTest).toHaveBeenCalled();
  });

  it('returns 400 for bps below minimum (1500)', async () => {
    const res = (await putAdminCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 1000 }),
      {} as never,
      superAdminCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for bps above maximum (3500)', async () => {
    const res = (await putAdminCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 4000 }),
      {} as never,
      superAdminCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
  });

  it('passes adminId to the repository patch', async () => {
    vi.mocked(commissionConfigRepo.patchCommissionConfig).mockResolvedValue({
      id: 'commission-config',
      defaultCommissionBps: 2200,
      updatedBy: 'admin-2',
      updatedAt: '2026-05-01T00:00:00.000Z',
    });

    await putAdminCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 2200 }),
      {} as never,
      financeAdmin,
    );

    expect(commissionConfigRepo.patchCommissionConfig).toHaveBeenCalledWith(
      { defaultCommissionBps: 2200 },
      'admin-2',
    );
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(commissionConfigRepo.patchCommissionConfig).mockRejectedValue(new Error('timeout'));

    const res = (await putAdminCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 2200 }),
      {} as never,
      superAdminCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
  });

  it('PUT thresholds returns the effective config, busts the cache, enqueues a fleet-wide hold repair and audits', async () => {
    vi.mocked(commissionConfigRepo.patchCommissionConfig).mockResolvedValue({
      id: 'commission-config',
      defaultCommissionBps: 2200,
      warnThresholdPaise: 200000,
      blockThresholdPaise: 400000,
      updatedBy: 'admin-1',
      updatedAt: 't',
    });

    const res = await putAdminCommissionConfigHandler(
      makePutReq({ warnThresholdPaise: 200000, blockThresholdPaise: 400000 }),
      {} as never,
      superAdminCtx,
    );

    expect(res.status).toBe(200);
    expect(res.jsonBody).toMatchObject({ warnThresholdPaise: 200000, blockThresholdPaise: 400000, holdEnforcementEnabled: false });
    expect(systemDocsRepo.enqueueHoldRepair).toHaveBeenCalledWith('ALL');
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'admin-1' }),
      'COMMISSION_CONFIG_UPDATED',
      'commission-config',
      'commission-config',
      expect.any(Object),
    );
  });

  it('PUT with warn >= block is a 400 and never reaches the repo', async () => {
    const res = await putAdminCommissionConfigHandler(
      makePutReq({ warnThresholdPaise: 500000, blockThresholdPaise: 500000 }),
      {} as never,
      superAdminCtx,
    );

    expect(res.status).toBe(400);
    expect(commissionConfigRepo.patchCommissionConfig).not.toHaveBeenCalled();
  });

  it('PUT with THRESHOLD_ORDER from the repo (merged against stored values) is a 400', async () => {
    vi.mocked(commissionConfigRepo.patchCommissionConfig).mockRejectedValue(
      Object.assign(new Error('x'), { code: 'THRESHOLD_ORDER' }),
    );

    const res = await putAdminCommissionConfigHandler(
      makePutReq({ warnThresholdPaise: 490000 }),
      {} as never,
      superAdminCtx,
    );

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('THRESHOLD_ORDER');
  });

  it('does not enqueue a hold repair for a bps-only patch', async () => {
    vi.mocked(commissionConfigRepo.patchCommissionConfig).mockResolvedValue({
      id: 'commission-config',
      defaultCommissionBps: 2600,
      updatedBy: 'admin-1',
      updatedAt: 't',
    });

    await putAdminCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 2600 }),
      {} as never,
      superAdminCtx,
    );

    expect(systemDocsRepo.enqueueHoldRepair).not.toHaveBeenCalled();
  });
});
