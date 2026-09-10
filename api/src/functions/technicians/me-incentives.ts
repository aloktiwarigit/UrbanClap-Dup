import '../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { systemDocsRepo } from '../../cosmos/system-docs-repository.js';
import { commissionReceivableRepo } from '../../cosmos/commission-receivable-repository.js';
import { incentiveRepo } from '../../cosmos/incentive-repository.js';
import { computeWeek } from '../../services/incentive.service.js';
import { istWeekKey, istWeekBounds } from '../../lib/ist-time.js';
import {
  RECENT_AWARD_LIMIT, TechnicianIncentivesResponseSchema, type TechnicianIncentivesResponse,
} from '../../schemas/incentive.js';

/**
 * Envelope-only validator: everything except `awards`. `awards` comes straight from
 * `incentiveRepo.listAwards`, which reads documents this same API already wrote through
 * `IncentiveAwardWriteSchema` — re-validating them here would just be re-checking our own write
 * path on every poll. This mirrors `admin/incentives/awards.ts`, which returns Cosmos-read award
 * docs unvalidated for the same reason. The envelope fields ARE freshly computed on every
 * request (cfg + computeWeek), so those keep the runtime check.
 */
const EnvelopeSchema = TechnicianIncentivesResponseSchema.omit({ awards: true });

/**
 * Live current-week progress plus the technician's recent awards. Everything here is
 * single-partition (pk = /technicianId), so it is cheap enough to poll from the wallet screen.
 *
 * `projectedBonusPaise` is run through the SAME computeWeek the Monday run uses, cap included.
 * Showing an uncapped milestone figure would promise a number the cap later takes away, which
 * is the fastest way to make a technician distrust the wallet.
 */
export const getTechnicianIncentivesHandler = async (
  req: HttpRequest, _ctx: InvocationContext,
): Promise<HttpResponseInit> => {
  let uid: string;
  try { uid = (await verifyTechnicianToken(req)).uid; }
  catch { return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } }; }

  try {
    const now = new Date();
    const weekKey = istWeekKey(now);
    const { weekStart, weekEnd, startUtc, endUtc } = istWeekBounds(weekKey);
    const [cfg, receivables, awards] = await Promise.all([
      systemDocsRepo.getEffectiveIncentiveConfig(),
      commissionReceivableRepo.getAllByTechnician(uid),
      incentiveRepo.listAwards(uid),
    ]);

    const c = computeWeek({ receivables, startUtc, endUtc, cfg });
    const nextMilestone = [...cfg.milestones].sort((a, b) => a.jobs - b.jobs)
      .find((m) => m.jobs > c.countedJobs);

    const envelope = EnvelopeSchema.parse({
      enabled: cfg.enabled,
      milestones: cfg.milestones,
      capFractionBps: cfg.capFractionBps,
      minCountableBookingPaise: cfg.minCountableBookingPaise,
      currentWeek: {
        weekKey, weekStart, weekEnd,
        countedJobs: c.countedJobs,
        countedCommissionPaise: c.countedCommissionPaise,
        ...(nextMilestone
          ? { nextMilestone, jobsToNextMilestone: nextMilestone.jobs - c.countedJobs }
          : {}),
        projectedBonusPaise: c.awardedPaise,
        projectedCapPaise: c.capPaise,
      },
    });
    const body: TechnicianIncentivesResponse = { ...envelope, awards: awards.slice(0, RECENT_AWARD_LIMIT) };
    return { status: 200, jsonBody: body, headers: { 'Cache-Control': 'private, max-age=60' } };
  } catch (err: unknown) {
    Sentry.captureException(err);
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('technicianIncentives', {
  methods: ['GET'], route: 'v1/technicians/me/incentives', authLevel: 'anonymous',
  handler: getTechnicianIncentivesHandler,
});
