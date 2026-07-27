package com.homeservices.customer.domain.tracking.model

/**
 * SAFE-SOS-002 — whether the customer-facing SOS control must be offered for this booking status.
 *
 * SOS is offered for the whole window in which a technician is dispatched to, travelling to,
 * standing at, or working inside the customer's home — not only while work is in progress.
 *
 * `EnRoute` and `Reached` are the highest-risk states, not the lowest: the customer is alone,
 * a stranger is arriving, and they have the least context about who is at the door. Gating SOS on
 * `InProgress` removed the control from exactly those moments.
 *
 * `AwaitingPriceApproval` is included because the technician is still physically on site.
 *
 * Deliberately exhaustive with no `else` branch: adding a new [BookingStatus] will fail compilation
 * here, forcing an explicit safety decision rather than silently defaulting to "no SOS".
 *
 * [BookingStatus.Unknown] FAILS OPEN — see below.
 */
public val BookingStatus.isSosEligible: Boolean
    get() =
        when (this) {
            BookingStatus.Assigned,
            BookingStatus.EnRoute,
            BookingStatus.Reached,
            BookingStatus.InProgress,
            BookingStatus.AwaitingPriceApproval,
            -> true

            // Fails OPEN, deliberately (Codex review MAJOR-3).
            //
            // The compile-time exhaustiveness above only protects statuses this client knows about.
            // `BookingStatus.fromFcmString` maps every unrecognised server string to `Unknown`
            // (BookingStatus.kt:46), so a NEW backend status — say ON_SITE or TECHNICIAN_WAITING —
            // arrives at an already-installed client as `Unknown`. Those are exactly the high-risk
            // on-site states, and an app store rollout does not reach every rural handset quickly.
            //
            // The two failure directions are not symmetric: a spurious SOS control on a finished
            // booking is mild noise for owner support, while a missing one during an on-site
            // emergency is the failure this feature exists to prevent. So an unrecognised status
            // shows the control.
            BookingStatus.Unknown,
            -> true

            BookingStatus.PendingPayment,
            BookingStatus.Paid,
            BookingStatus.Searching,
            BookingStatus.Completed,
            BookingStatus.Cancelled,
            BookingStatus.Closed,
            BookingStatus.Unfulfilled,
            -> false
        }
