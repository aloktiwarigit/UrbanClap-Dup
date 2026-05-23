package com.homeservices.customer.ui.catalogue

import com.homeservices.corenav.PendingAction
import com.homeservices.customer.domain.booking.model.CustomerBooking

/**
 * UI state for the durable-hooks sections on the customer home tab (E11-S03).
 *
 * Three independent flows are merged into one state:
 * - [Ready.pendingActions] — top 3 ACTIVE pending actions sorted by priority (E11-S03 §AC-2)
 * - [Ready.activeBooking]  — first booking in an active status, or null (E11-S03 §AC-3)
 * - [Ready.recentBookings] — last 5 COMPLETED bookings sorted newest-first (E11-S03 §AC-4)
 *
 * [Loading] is emitted while auth state is unresolved or flows have not produced a first value.
 */
public sealed class CustomerHomeUiState {
    /** Waiting for auth state or first emission from any of the three flows. */
    public data object Loading : CustomerHomeUiState()

    /**
     * All three flows have produced their first value.
     *
     * Any of the three lists / nullable fields may be empty / null —
     * the composable hides the corresponding section when the data is absent.
     */
    public data class Ready(
        public val pendingActions: List<PendingAction>,
        public val activeBooking: CustomerBooking?,
        public val recentBookings: List<CustomerBooking>,
        public val pendingPaymentBooking: CustomerBooking? = null,
    ) : CustomerHomeUiState()
}
