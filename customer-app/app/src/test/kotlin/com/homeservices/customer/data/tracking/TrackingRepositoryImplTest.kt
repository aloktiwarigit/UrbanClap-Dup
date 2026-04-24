package com.homeservices.customer.data.tracking

import com.homeservices.customer.domain.tracking.model.BookingStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class TrackingRepositoryImplTest {

    @Test
    public fun `BookingStatus fromFcmString maps EN_ROUTE`() {
        assertThat(BookingStatus.fromFcmString("EN_ROUTE")).isEqualTo(BookingStatus.EnRoute)
    }

    @Test
    public fun `BookingStatus fromFcmString maps REACHED`() {
        assertThat(BookingStatus.fromFcmString("REACHED")).isEqualTo(BookingStatus.Reached)
    }

    @Test
    public fun `BookingStatus fromFcmString maps IN_PROGRESS`() {
        assertThat(BookingStatus.fromFcmString("IN_PROGRESS")).isEqualTo(BookingStatus.InProgress)
    }

    @Test
    public fun `BookingStatus fromFcmString maps COMPLETED`() {
        assertThat(BookingStatus.fromFcmString("COMPLETED")).isEqualTo(BookingStatus.Completed)
    }

    @Test
    public fun `BookingStatus fromFcmString maps CANCELLED`() {
        assertThat(BookingStatus.fromFcmString("CANCELLED")).isEqualTo(BookingStatus.Cancelled)
    }

    @Test
    public fun `BookingStatus fromFcmString returns Unknown for unrecognised string`() {
        assertThat(BookingStatus.fromFcmString("GARBAGE")).isEqualTo(BookingStatus.Unknown)
    }
}
