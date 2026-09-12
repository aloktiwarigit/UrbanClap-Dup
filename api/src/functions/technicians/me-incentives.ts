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
  RECENT_AWARD_LIMIT, TechnicianIncentivesResponseSchema, IncentiveAwardDocSchema,
  type TechnicianIncentivesResponse, type IncentiveAwardDoc,
} from '../../schemas/incentive.js';

/**
 * Envelope-only validator: everything except `awards`. The envelope fields are freshly computed
 * on every request (cfg + computeWeek), so a runtime check here catches a real shape drift.
 * `awards` is validated separately, per-item, below — see `parseAwards`.
 */
const EnvelopeSchema = TechnicianIncentivesResponseSchema.omit({ awards: true });

/**
 * Validates each award doc individually rather than the array as a whole, and returns the
 * PARSED (not raw) docs — matching `commission-due.ts`'s "a schema regression is distinguishable
 * from Cosmos flakiness" convention (same `Sentry.captureException`), but scoped per-award so one
 * malformed award (a future `awardShape` change, or a hypothetical second write path bypassing
 * `incentive.service.ts`) never takes down the whole response for a technician who has other
 * perfectly good awards. Returning the parsed value, not the raw one, means a future
 * `.transform()`/default on `IncentiveAwardDocSchema` benefits technician responses too.
 */
function parseAwards(raw: readonly unknown[], technicianId: string): IncentiveAwardDoc[] {
  const parsed: IncentiveAwardDoc[] = [];
  for (const entry of raw) {
    const result = IncentiveAwardDocSchema.safeParse(entry);
    if (result.success) {
      parsed.push(result.data);
    } else {
      const awardId = (entry as { id?: unknown } | null)?.id;
      // Same capture as commission-due.ts's schema-drift comment: captured to Sentry separately
      // so a shape regression is distinguishable from Cosmos flakiness, scoped to just this award.
      Sentry.captureException(result.error, { extra: { technicianId, awardId } });
    }
  }
  return parsed;
}

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
    // Codex P2: if an admin disables the programme after configuring milestones,
    // `cfg.milestones`/`cfg.capFractionBps` still describe the old, now-inert table --
    // `runIncentiveWeek` (the orchestrator) skips every technician when `!cfg.enabled`,
    // so a bonus projected here would never actually be paid. Zero the projection when
    // disabled rather than reporting a milestone/bonus the weekly run will never award.
    const nextMilestone = cfg.enabled
      ? [...cfg.milestones].sort((a, b) => a.jobs - b.jobs).find((m) => m.jobs > c.countedJobs)
      : undefined;

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
        projectedBonusPaise: cfg.enabled ? c.awardedPaise : 0,
        projectedCapPaise: cfg.enabled ? c.capPaise : 0,
      },
    });
    const body: TechnicianIncentivesResponse = {
      ...envelope,
      awards: parseAwards(awards.slice(0, RECENT_AWARD_LIMIT), uid),
    };
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
