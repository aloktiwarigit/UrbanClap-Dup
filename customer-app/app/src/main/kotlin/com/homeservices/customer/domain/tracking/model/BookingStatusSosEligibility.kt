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

            BookingStatus.PendingPayment,
            BookingStatus.Paid,
            BookingStatus.Searching,
            BookingStatus.Completed,
            BookingStatus.Cancelled,
            BookingStatus.Closed,
            BookingStatus.Unfulfilled,
            BookingStatus.Unknown,
            -> false
        }
