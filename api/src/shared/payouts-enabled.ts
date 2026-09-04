/**
 * P0-0 — Kill switch for the dormant prepaid (Razorpay Route) payout machinery.
 *
 * The pilot is cash-only: the technician collects cash at the door and *owes* the
 * platform a commission (see `commission_receivables`). The prepaid-era code paths
 * move money in the opposite direction — they pay the technician out.
 *
 * Those paths were previously inert only because `RazorpayRouteService` throws when
 * `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are absent. That is an accident of
 * configuration, not a decision: the day those settings are populated for any reason,
 * two daily timers would start transferring money to technicians who owe the platform.
 *
 * Payouts are therefore off unless explicitly and exactly opted into. Credential
 * presence alone must never arm them.
 *
 * Re-enabling is a deliberate operational act — see `docs/runbook.md`.
 */
export function arePayoutsEnabled(): boolean {
  return process.env['PAYOUTS_ENABLED'] === 'true';
}
