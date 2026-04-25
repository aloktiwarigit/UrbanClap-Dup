package com.homeservices.customer.data.rating

import com.homeservices.customer.data.rating.remote.dto.GetRatingResponseDto
import com.homeservices.customer.data.rating.remote.dto.SidePayloadDto
import com.homeservices.customer.domain.rating.model.CustomerRating
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import com.homeservices.customer.domain.rating.model.TechRating
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class RatingDtosTest {
    @Test
    public fun `toDomain maps PENDING status correctly`() {
        val dto =
            GetRatingResponseDto(
                bookingId = "bk-1",
                status = "PENDING",
                revealedAt = null,
                customerSide = SidePayloadDto(status = "PENDING"),
                techSide = SidePayloadDto(status = "PENDING"),
            )
        val snapshot = dto.toDomain()
        assertThat(snapshot.status).isEqualTo(RatingSnapshot.Status.PENDING)
        assertThat(snapshot.customerSide).isEqualTo(SideState.Pending)
        assertThat(snapshot.techSide).isEqualTo(SideState.Pending)
    }

    @Test
    public fun `toDomain maps REVEALED status with full customer side`() {
        val dto =
            GetRatingResponseDto(
                bookingId = "bk-1",
                status = "REVEALED",
                revealedAt = "2026-04-24T12:30:00.000Z",
                customerSide =
                    SidePayloadDto(
                        status = "SUBMITTED",
                        overall = 5,
                        subScores = mapOf("punctuality" to 5, "skill" to 4, "behaviour" to 5),
                        submittedAt = "2026-04-24T12:00:00.000Z",
                    ),
                techSide =
                    SidePayloadDto(
                        status = "SUBMITTED",
                        overall = 4,
                        subScores = mapOf("behaviour" to 4, "communication" to 5),
                        submittedAt = "2026-04-24T12:30:00.000Z",
                    ),
            )
        val snapshot = dto.toDomain()
        assertThat(snapshot.status).isEqualTo(RatingSnapshot.Status.REVEALED)
        assertThat(snapshot.revealedAt).isEqualTo("2026-04-24T12:30:00.000Z")
        val custSide = snapshot.customerSide
        assertThat(custSide).isInstanceOf(SideState.Submitted::class.java)
        val custRating = (custSide as SideState.Submitted).rating as CustomerRating
        assertThat(custRating.overall).isEqualTo(5)
        assertThat(custRating.subScores.punctuality).isEqualTo(5)
        val techSide = snapshot.techSide
        assertThat(techSide).isInstanceOf(SideState.Submitted::class.java)
        val techRating = (techSide as SideState.Submitted).rating as TechRating
        assertThat(techRating.overall).isEqualTo(4)
        assertThat(techRating.subScores.communication).isEqualTo(5)
    }

    @Test
    public fun `toDomain returns Pending for SUBMITTED side without required fields`() {
        val dto =
            GetRatingResponseDto(
                bookingId = "bk-1",
                status = "PARTIALLY_SUBMITTED",
                customerSide = SidePayloadDto(status = "SUBMITTED"),
                techSide = SidePayloadDto(status = "PENDING"),
            )
        val snapshot = dto.toDomain()
        assertThat(snapshot.customerSide).isEqualTo(SideState.Pending)
    }
}
