import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { FinanceSummaryQuerySchema } from '../../../schemas/finance.js';
import { getDailyPnL } from '../../../cosmos/finance-repository.js';
import { arePayoutsEnabled } from '../../../shared/payouts-enabled.js';

export const adminFinanceSummaryHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  const parsed = FinanceSummaryQuerySchema.safeParse({
    from: req.query.get('from') ?? '',
    to: req.query.get('to') ?? '',
  });
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  try {
    const summary = await getDailyPnL(parsed.data.from, parsed.data.to);
    // Single source of truth: the same arePayoutsEnabled() the payout-approval endpoint and the
    // prepaid-payout timers already gate on (api/src/shared/payouts-enabled.ts). Read it once,
    // here, rather than adding a second env-var check for admin-web to key off of.
    return { status: 200, jsonBody: { ...summary, payoutsEnabled: arePayoutsEnabled() } };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('adminFinanceSummary', {
  methods: ['GET'],
  route: 'v1/admin/finance/summary',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager', 'finance'])(adminFinanceSummaryHandler),
});
