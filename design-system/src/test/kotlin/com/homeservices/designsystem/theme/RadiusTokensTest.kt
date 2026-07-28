package com.homeservices.designsystem.theme

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/** Asserts every D1 corner-radius expression value. */
internal class RadiusTokensTest {
    @Test
    internal fun customer_radius_expression_is_8_12_20() {
        assertThat(HomeservicesCustomerRadius.sm.value).isEqualTo(8f)
        assertThat(HomeservicesCustomerRadius.md.value).isEqualTo(12f)
        assertThat(HomeservicesCustomerRadius.lg.value).isEqualTo(20f)
        assertThat(HomeservicesCustomerRadius.xl.value).isEqualTo(20f)
    }

    @Test
    internal fun technician_radius_expression_is_4_8_12() {
        assertThat(HomeservicesTechnicianRadius.sm.value).isEqualTo(4f)
        assertThat(HomeservicesTechnicianRadius.md.value).isEqualTo(8f)
        assertThat(HomeservicesTechnicianRadius.lg.value).isEqualTo(12f)
        assertThat(HomeservicesTechnicianRadius.xl.value).isEqualTo(12f)
    }

    @Test
    internal fun homeservicesRadius_remains_the_customer_default() {
        assertThat(HomeservicesRadius.sm.value).isEqualTo(8f)
        assertThat(HomeservicesRadius.md.value).isEqualTo(12f)
        assertThat(HomeservicesRadius.lg.value).isEqualTo(20f)
        assertThat(HomeservicesRadius.xl.value).isEqualTo(20f)
    }

    @Test
    internal fun full_is9999dp() {
        assertThat(HomeservicesRadius.full.value).isEqualTo(9999f)
        assertThat(HomeservicesCustomerRadius.full.value).isEqualTo(9999f)
        assertThat(HomeservicesTechnicianRadius.full.value).isEqualTo(9999f)
    }

    @Test
    internal fun localHomeservicesRadius_isNotNull() {
        assertThat(LocalHomeservicesRadius).isNotNull()
    }
}
