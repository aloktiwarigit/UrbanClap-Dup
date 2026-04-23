// api/src/functions/admin/compliance/ssc-levy.ts
import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext, HttpRequest, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { sscLevyRepo } from '../../../cosmos/ssc-levy-repository.js';
import { createTransfer } from '../../../services/razorpay.service.js';
import { auditLog } from '../../../services/auditLog.service.js';
import {
  calculateQuarterlyGmv,
  getPriorQuarter,
  quarterBounds,
  computeLevyAmount,
  sendOwnerFcmNotification,
  sendOwnerEmail,
} from '../../../services/ssc-levy.service.js';

export async function sscLevyTimerHandler(
  _timer: Timer,
  context: InvocationContext,
): Promise<void> {
  const quarter = getPriorQuarter();
  const existing = await sscLevyRepo.getLevyByQuarter(quarter);
  if (existing) {
    context.log(`SSC_LEVY_SKIP quarter=${quarter} status=${existing.status}`);
    return;
  }

  const { fromIso, toIso } = quarterBounds(quarter);
  const gmv = await calculateQuarterlyGmv(fromIso, toIso);
  const levyAmount = computeLevyAmount(gmv);

  const levy = await sscLevyRepo.createLevy({
    quarter,
    gmv,
    levyRate: 0.01,
    levyAmount,
    status: 'PENDING_APPROVAL',
  });

  context.log(`SSC_LEVY_CREATED id=${levy.id} quarter=${quarter} gmv=${gmv} levyAmount=${levyAmount}`);

  await Promise.allSettled([
    sendOwnerFcmNotification(levy),
    sendOwnerEmail(levy),
  ]);
}

export const approveSscLevyHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> => {
  if (admin.role !== 'super-admin') {
    return { status: 403, jsonBody: { code: 'FORBIDDEN', requiredRoles: ['super-admin'] } };
  }

  const levyId = req.params['id'] ?? '';
  const levy = await sscLevyRepo.getLevyById(levyId);
  if (!levy) return { status: 404, jsonBody: { code: 'LEVY_NOT_FOUND' } };

  if (levy.status !== 'PENDING_APPROVAL') {
    return { status: 409, jsonBody: { code: 'INVALID_STATUS', currentStatus: levy.status } };
  }

  const approvedAt = new Date().toISOString();
  await sscLevyRepo.updateLevy(levy.id, levy.quarter, { status: 'APPROVED', approvedAt });

  const fundAccountId = process.env['SSC_FUND_ACCOUNT_ID'];
  if (!fundAccountId) {
    return { status: 500, jsonBody: { code: 'CONFIGURATION_ERROR', message: 'SSC_FUND_ACCOUNT_ID not set' } };
  }

  try {
    const { transferId } = await createTransfer({
      accountId: fundAccountId,
      amount: levy.levyAmount,
      notes: { quarter: levy.quarter, levyId: levy.id, initiatedBy: admin.adminId },
      idempotencyKey: `ssc-levy-${levy.id}`,
    });

    const transferredAt = new Date().toISOString();
    await sscLevyRepo.updateLevy(levy.id, levy.quarter, {
      status: 'TRANSFERRED',
      razorpayTransferId: transferId,
      transferredAt,
    });

    await auditLog(
      { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
      'SSC_LEVY_TRANSFER',
      'ssc_levy',
      levy.id,
      { quarter: levy.quarter, levyAmount: levy.levyAmount, razorpayTransferId: transferId },
      { ip: req.headers.get('x-forwarded-for') ?? 'unknown' },
    );

    return {
      status: 200,
      jsonBody: { levyId: levy.id, quarter: levy.quarter, transferId, status: 'TRANSFERRED' },
    };
  } catch (err: unknown) {
    await sscLevyRepo.updateLevy(levy.id, levy.quarter, { status: 'FAILED' });
    return {
      status: 502,
      jsonBody: {
        code: 'TRANSFER_FAILED',
        message: err instanceof Error ? err.message : 'transfer failed',
      },
    };
  }
};

app.timer('sscLevyQuarterly', {
  schedule: '0 0 0 1 1,4,7,10 *',
  handler: sscLevyTimerHandler,
});

app.http('approveSscLevy', {
  methods: ['POST'],
  route: 'v1/admin/compliance/ssc-levy/{id}/approve',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(approveSscLevyHandler),
});
