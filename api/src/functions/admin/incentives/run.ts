import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { runIncentiveWeek } from '../../../services/incentive.service.js';
import { IST_WEEK_KEY_RE, istWeekBounds, previousIstWeekKey } from '../../../lib/ist-time.js';

/**
 * Manual incentive run. Super-admin only — it moves money.
 *
 * Idempotent by construction: every award id is `inc:<tech>:<week>`, so re-running a week that
 * already awarded is a no-op replay per technician (see runIncentiveWeek). Safe to re-issue
 * after a failed timer run, and the response's `replayed` count says how much was already done.
 */
export const runIncentivesHandler: AdminHttpHandler = async (
  req: HttpRequest, _ctx: InvocationContext, admin: AdminContext,
): Promise<HttpResponseInit> => {
  // Default to the previous week, exactly like the timer: a week still in progress must never
  // be awarded by an argument-less call.
  const weekKey = req.query.get('week') ?? previousIstWeekKey(new Date());
  if (!IST_WEEK_KEY_RE.test(weekKey)) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', message: 'week must be YYYY-Www' } };
  }
  try {
    // Codex P3: the regex alone accepts a syntactically valid but nonexistent ISO week (e.g.
    // 2027-W53 -- not every year has 53 weeks). istWeekBounds throws for that case; catching
    // it here keeps a client's malformed-week mistake a 400, not a 502/Sentry-captured
    // upstream error indistinguishable from a real Cosmos failure.
    istWeekBounds(weekKey);
  } catch {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', message: 'week must be YYYY-Www' } };
  }
  try {
    return { status: 200, jsonBody: await runIncentiveWeek(weekKey, admin.adminId) };
  } catch (err: unknown) {
    Sentry.captureException(err);
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('runIncentives', {
  methods: ['POST'], route: 'v1/admin/incentives/run', authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(runIncentivesHandler),
});
