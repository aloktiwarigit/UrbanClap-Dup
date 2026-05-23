package com.homeservices.technician.data.activeJob

/**
 * In-process payload describing a server-confirmed booking-status change.
 *
 * Posted by [com.homeservices.technician.data.fcm.HomeservicesFcmService] when an
 * inbound FCM message (`BOOKING_STATUS_UPDATE`, `CUSTOMER_PRICE_APPROVED`,
 * `CUSTOMER_PRICE_REJECTED`) arrives, consumed by
 * [com.homeservices.technician.ui.activeJob.ActiveJobViewModel] to refresh the
 * open active-job screen without blocking on the next polling tick.
 *
 * @property bookingId The booking the event applies to.
 * @property newStatus Canonical status name (e.g. `PRICE_APPROVED`, `ASSIGNED`).
 * @property priceApprovedPaise Optional, only populated for price-decision events.
 */
public data class BookingStatusEvent(
    val bookingId: String,
    val newStatus: String,
    val priceApprovedPaise: Long? = null,
)
