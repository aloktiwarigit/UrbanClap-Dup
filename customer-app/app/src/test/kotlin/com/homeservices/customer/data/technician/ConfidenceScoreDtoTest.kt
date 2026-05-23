package com.homeservices.customer.data.technician

import com.homeservices.customer.data.technician.remote.dto.ConfidenceScoreDto
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class ConfidenceScoreDtoTest {
    @Test
    public fun `toDomain maps all fields correctly`() {
        val dto =
            ConfidenceScoreDto(
                onTimePercent = 92,
                areaRating = 4.8,
                nearestEtaMinutes = 55,
                dataPointCount = 10,
                isLimitedData = false,
            )
        val domain = dto.toDomain()

        assertThat(domain.onTimePercent).isEqualTo(92)
        assertThat(domain.areaRating).isEqualTo(4.8)
        assertThat(domain.nearestEtaMinutes).isEqualTo(55)
        assertThat(domain.dataPointCount).isEqualTo(10)
        assertThat(domain.isLimitedData).isFalse()
    }

    @Test
    public fun `toDomain handles null optional fields`() {
        val dto =
            ConfidenceScoreDto(
                onTimePercent = 75,
                areaRating = null,
                nearestEtaMinutes = null,
                dataPointCount = 3,
                isLimitedData = true,
            )
        val domain = dto.toDomain()

        assertThat(domain.areaRating).isNull()
        assertThat(domain.nearestEtaMinutes).isNull()
        assertThat(domain.isLimitedData).isTrue()
    }
}
