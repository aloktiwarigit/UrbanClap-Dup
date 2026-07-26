package com.homeservices.customer.domain.tracking

import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.isSosEligible
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

/**
 * SAFE-SOS-002 — the SOS control must be reachable for the whole window in which a technician
 * is dispatched to, travelling to, standing at, or working inside the customer's home.
 *
 * Before this change `LiveTrackingScreen` gated SOS on `status is BookingStatus.InProgress`, so the
 * control was absent during EN_ROUTE and REACHED — precisely the window in which a customer is alone
 * with an arriving stranger and has the least context. See docs/design/uiux-audit-2026.md.
 */
public class BookingStatusSosEligibilityTest {
    @Test
    public fun `sos is available once a technician is assigned`(): Unit {
        assertThat(BookingStatus.Assigned.isSosEligible).isTrue()
    }

    @Test
    public fun `sos is available while the technician is travelling`(): Unit {
        assertThat(BookingStatus.EnRoute.isSosEligible).isTrue()
    }

    @Test
    public fun `sos is available when the technician has reached the address`(): Unit {
        assertThat(BookingStatus.Reached.isSosEligible).isTrue()
    }

    @Test
    public fun `sos is available while work is in progress`(): Unit {
        assertThat(BookingStatus.InProgress.isSosEligible).isTrue()
    }

    @Test
    public fun `sos is available while awaiting price approval because the tech is still on site`(): Unit {
        assertThat(BookingStatus.AwaitingPriceApproval.isSosEligible).isTrue()
    }

    @Test
    public fun `sos is not offered before a technician is dispatched`(): Unit {
        assertThat(BookingStatus.PendingPayment.isSosEligible).isFalse()
        assertThat(BookingStatus.Paid.isSosEligible).isFalse()
        assertThat(BookingStatus.Searching.isSosEligible).isFalse()
    }

    @Test
    public fun `sos is not offered once the visit has ended`(): Unit {
        assertThat(BookingStatus.Completed.isSosEligible).isFalse()
        assertThat(BookingStatus.Cancelled.isSosEligible).isFalse()
        assertThat(BookingStatus.Closed.isSosEligible).isFalse()
        assertThat(BookingStatus.Unfulfilled.isSosEligible).isFalse()
    }

    @Test
    public fun `unknown status does not offer sos`(): Unit {
        assertThat(BookingStatus.Unknown.isSosEligible).isFalse()
    }

    @Test
    public fun `every on-site status parsed from fcm is sos eligible`(): Unit {
        listOf("ASSIGNED", "EN_ROUTE", "REACHED", "IN_PROGRESS", "AWAITING_PRICE_APPROVAL")
            .forEach { raw ->
                assertThat(BookingStatus.fromFcmString(raw).isSosEligible)
                    .describedAs("SOS must be reachable for FCM status %s", raw)
                    .isTrue()
            }
    }
}
