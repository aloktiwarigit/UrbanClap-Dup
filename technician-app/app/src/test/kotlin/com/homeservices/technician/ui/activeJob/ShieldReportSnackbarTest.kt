package com.homeservices.technician.ui.activeJob

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class ShieldReportSnackbarTest {
    @Test
    public fun `success returns the success message`(): Unit {
        val result = shieldReportSnackbarMessage(success = true, error = null, successMessage = "OK", genericErrorMessage = "ERR")
        assertThat(result).isEqualTo("OK")
    }

    @Test
    public fun `error returns the generic error message`(): Unit {
        val result =
            shieldReportSnackbarMessage(
                success = false,
                error = "network timeout",
                successMessage = "OK",
                genericErrorMessage = "ERR",
            )
        assertThat(result).isEqualTo("ERR")
    }

    @Test
    public fun `neither success nor error returns null`(): Unit {
        val result = shieldReportSnackbarMessage(success = false, error = null, successMessage = "OK", genericErrorMessage = "ERR")
        assertThat(result).isNull()
    }

    @Test
    public fun `success takes priority when both are somehow set`(): Unit {
        val result = shieldReportSnackbarMessage(success = true, error = "stale error", successMessage = "OK", genericErrorMessage = "ERR")
        assertThat(result).isEqualTo("OK")
    }
}
