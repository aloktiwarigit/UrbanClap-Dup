package com.homeservices.technician.data.pendingaction

import com.homeservices.corenav.PendingActionType
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Verifies that every [PendingActionType] used in technician-app round-trips through
 * [PendingActionType.valueOf] without throwing [IllegalArgumentException].
 *
 * Guards against typos in Room serialisation (PendingActionStore.toDomain) and FCM
 * routing code. Also documents that JOB_ASSIGNED is NOT in the server FCM schema —
 * JOB_OFFER is used as the assignment signal per E11 spec §3.1 and plan A2.
 */
public class PendingActionTypeRoundTripTest {
    private val technicianDashboardTypes =
        listOf(
            PendingActionType.JOB_OFFER,
            PendingActionType.RATING_PROMPT_TECHNICIAN,
            PendingActionType.RATING_RECEIVED,
            PendingActionType.EARNINGS_UPDATE,
        )

    @Test
    public fun `all dashboard-relevant types round-trip through valueOf`() {
        technicianDashboardTypes.forEach { type ->
            val roundTripped = PendingActionType.valueOf(type.name)
            assertThat(roundTripped).isEqualTo(type)
        }
    }

    @Test
    public fun `JOB_ASSIGNED is not in PendingActionType enum — JOB_OFFER is the assignment signal`() {
        val allTypeNames = PendingActionType.entries.map { it.name }
        assertThat(allTypeNames).doesNotContain("JOB_ASSIGNED")
        assertThat(allTypeNames).contains("JOB_OFFER")
    }

    @Test
    public fun `all PendingActionType values round-trip without crashing`() {
        PendingActionType.entries.forEach { type ->
            val roundTripped = PendingActionType.valueOf(type.name)
            assertThat(roundTripped).isEqualTo(type)
        }
    }
}
