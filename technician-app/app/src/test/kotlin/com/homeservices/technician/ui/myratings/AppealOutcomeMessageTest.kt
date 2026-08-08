package com.homeservices.technician.ui.myratings

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class AppealOutcomeMessageTest {
    private fun message(state: AppealState): String? =
        appealOutcomeMessage(
            state = state,
            successMessage = "Appeal submitted.",
            quotaExceededTemplate = "Limit reached — try again after %s.",
            genericErrorMessage = "Could not submit appeal.",
            formatNextAvailable = { "formatted($it)" },
        )

    @Test
    public fun `idle returns null`(): Unit {
        assertThat(message(AppealState.Idle)).isNull()
    }

    @Test
    public fun `loading returns null`(): Unit {
        assertThat(message(AppealState.Loading(bookingId = "bk-1"))).isNull()
    }

    @Test
    public fun `success returns the success message`(): Unit {
        assertThat(message(AppealState.Success)).isEqualTo("Appeal submitted.")
    }

    @Test
    public fun `quota exceeded formats the next-available date into the template`(): Unit {
        assertThat(message(AppealState.QuotaExceeded(nextAvailableAt = "2026-08-14T00:00:00Z")))
            .isEqualTo("Limit reached — try again after formatted(2026-08-14T00:00:00Z).")
    }

    @Test
    public fun `quota exceeded falls back to a placeholder when nextAvailableAt is null`(): Unit {
        assertThat(message(AppealState.QuotaExceeded(nextAvailableAt = null)))
            .isEqualTo("Limit reached — try again after —.")
    }

    @Test
    public fun `error returns the generic error message`(): Unit {
        assertThat(message(AppealState.Error)).isEqualTo("Could not submit appeal.")
    }
}
