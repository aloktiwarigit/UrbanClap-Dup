/**
 * E11-S02 — Technician dashboard aggregator endpoint.
 *
 * GET /v1/technicians/me/dashboard
 *   Auth: verifyTechnicianToken (Firebase ID token)
 *   Returns: KYC status + active job + pending offer count + today's earnings + today's ratings
 */

import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { z } from 'zod';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { getActivePendingActions } from '../cosmos/pending-action-repository.js';
import { getKycByTechnicianId } from '../cosmos/technician-repository.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { getCosmosClient, DB_NAME } from '../cosmos/client.js';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { buildEarningEvents, sumNetForIstDate, IST_OFFSET_MS } from '../services/earnings.service.js';

// ── Response schema ───────────────────────────────────────────────────────────

export const TechnicianDashboardResponseSchema = z.object({
  kycStatus: z.string().nullable(),
  activeJob: z.object({
    bookingId: z.string(),
    status: z.string(),
    serviceId: z.string().optional(),
    slotDate: z.string().optional(),
    slotWindow: z.string().optional(),
    addressText: z.string().optional(),
  }).nullable(),
  pendingOfferCount: z.number().int().nonnegative(),
  todayEarningsInPaise: z.number().int().nonnegative(),
  todayRatingCount: z.number().int().nonnegative(),
  todayRatingAverage: z.number().nonnegative().nullable(),
  fetchedAt: z.string().datetime(),
});

export type TechnicianDashboardResponse = z.infer<typeof TechnicianDashboardResponseSchema>;

// ── Active job statuses ───────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set([
  'ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL',
]);

// P0-1: IST_OFFSET_MS now comes from services/earnings.service.ts — one definition,
// shared with the earnings endpoint.

function getIndiaToday(): string {
  const shifted = new Date(Date.now() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Compute UTC bounds for a calendar date expressed in IST (UTC+5:30).
 *
 * Problem with naive UTC bounds: `YYYY-MM-DDT00:00:00Z` = 05:30 IST, so ratings
 * submitted between 00:00–05:29 IST are omitted and ratings from early next-day UTC
 * are incorrectly included.
 *
 * Correct bounds:
 *   IST midnight = UTC 00:00 − 5h30m = previous UTC day at 18:30:00.
 *   IST next midnight = UTC next-day at 18:30:00.
 *
 * @param istDate  YYYY-MM-DD string representing the date in IST (from getIndiaToday())
 * @returns { start, end } as UTC ISO strings covering the full IST calendar day.
 */
export function istMidnightUtcBounds(istDate: string): { start: string; end: string } {
  // Parse the IST date parts to avoid locale-sensitive Date parsing.
  const [year, month, day] = istDate.split('-').map(Number) as [number, number, number];
  // Construct the IST midnight as a UTC Date by subtracting IST offset.
  // new Date(Date.UTC(y, m-1, d)) = YYYY-MM-DDT00:00:00.000Z (UTC midnight)
  // IST midnight = that UTC time minus 5h30m
  const istMidnightUtcMs = Date.UTC(year, month - 1, day) - IST_OFFSET_MS;
  const start = new Date(istMidnightUtcMs).toISOString();
  const end   = new Date(istMidnightUtcMs + 24 * 60 * 60 * 1_000).toISOString();
  return { start, end };
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function getTechnicianDashboardHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  try {
    const todayDate = getIndiaToday();

    // Fan out all reads in parallel
    const [kyc, bookings, pendingActions, todayRatings, ledgerEntries, receivables] = await Promise.all([
      getKycByTechnicianId(uid).catch(() => null),
      bookingRepo.getByTechnicianId(uid).catch(() => []),
      getActivePendingActions(uid, new Date().toISOString(), 'technician').catch(() => []),
      fetchTodayRatings(uid, todayDate, ctx),
      walletLedgerRepo.getAllByTechnicianId(uid).catch(() => []),
      commissionReceivableRepo.getAllByTechnician(uid).catch(() => []),
    ]);

    // Active job: first booking in an active status
    const activeBooking = bookings.find((b) => ACTIVE_STATUSES.has(b.status)) ?? null;

    // P0-1: today's earnings are what the technician KEEPS, from the same shared
    // builder the earnings endpoint uses — so the dashboard and the earnings screen
    // cannot report different numbers for the same job.
    //
    // This previously summed `finalAmount ?? amount` for bookings with
    // slotDate === today, i.e. GROSS with no commission subtracted, while the
    // earnings screen reported ₹0. Basis is now the settlement timestamp rather
    // than the booked slot date, which is also the more honest reading of
    // "earned today" — a job settled after midnight belongs to the day it settled.
    const todayEarnings = sumNetForIstDate(buildEarningEvents(ledgerEntries, receivables), todayDate);

    // Pending offer count from pending actions
    const pendingOfferCount = pendingActions.filter(
      (a) => a.type === 'JOB_OFFER' && a.status === 'ACTIVE',
    ).length;

    const dashboard: TechnicianDashboardResponse = TechnicianDashboardResponseSchema.parse({
      kycStatus: kyc?.kycStatus ?? null,
      activeJob: activeBooking
        ? {
            bookingId: activeBooking.id,
            status: activeBooking.status,
            serviceId: activeBooking.serviceId,
            slotDate: activeBooking.slotDate,
            slotWindow: activeBooking.slotWindow,
            addressText: activeBooking.addressText,
          }
        : null,
      pendingOfferCount,
      todayEarningsInPaise: todayEarnings,
      todayRatingCount: todayRatings.count,
      todayRatingAverage: todayRatings.average,
      fetchedAt: new Date().toISOString(),
    });

    return {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
      jsonBody: dashboard,
    };
  } catch (err) {
    ctx.error('[technician-dashboard] Error', String(err));
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
}

// ── Today's ratings helper ────────────────────────────────────────────────────

async function fetchTodayRatings(
  technicianId: string,
  todayDate: string,
  ctx: InvocationContext,
): Promise<{ count: number; average: number | null }> {
  try {
    const db = getCosmosClient().database(DB_NAME);
    // Use IST-aligned UTC bounds so ratings submitted between 00:00–05:29 IST
    // (which fall on the previous UTC date) are correctly included, and early
    // next-day UTC ratings are correctly excluded. See istMidnightUtcBounds().
    const { start: todayStart, end: todayEnd } = istMidnightUtcBounds(todayDate);

    const { resources } = await db
      .container('ratings')
      .items.query<{ overall: number }>({
        query: `SELECT c.customerOverall as overall
                FROM c
                WHERE c.technicianId = @techId
                  AND c.customerSubmittedAt >= @start
                  AND c.customerSubmittedAt <= @end
                  AND IS_DEFINED(c.customerOverall)`,
        parameters: [
          { name: '@techId', value: technicianId },
          { name: '@start', value: todayStart },
          { name: '@end', value: todayEnd },
        ],
      })
      .fetchAll();

    if (resources.length === 0) return { count: 0, average: null };

    const sum = resources.reduce((s, r) => s + (r.overall ?? 0), 0);
    return {
      count: resources.length,
      average: Math.round((sum / resources.length) * 10) / 10,
    };
  } catch (err) {
    ctx.warn('[technician-dashboard] Could not fetch today ratings', String(err));
    return { count: 0, average: null };
  }
}

// ── Registration ──────────────────────────────────────────────────────────────

app.http('technicianDashboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/technicians/me/dashboard',
  handler: getTechnicianDashboardHandler,
});
