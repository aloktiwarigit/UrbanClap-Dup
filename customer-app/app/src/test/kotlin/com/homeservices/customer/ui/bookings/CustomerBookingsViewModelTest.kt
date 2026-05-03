package com.homeservices.customer.ui.bookings

import com.homeservices.customer.domain.booking.GetCustomerBookingsUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class CustomerBookingsViewModelTest {
    private val dispatcher = StandardTestDispatcher()
    private val getBookings: GetCustomerBookingsUseCase = mockk()

    @Before
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `loads customer bookings on init`(): Unit =
        runTest {
            val booking = sampleBooking()
            every { getBookings() } returns flowOf(Result.success(listOf(booking)))

            val vm = CustomerBookingsViewModel(getBookings)
            advanceUntilIdle()

            assertThat(vm.uiState.value).isEqualTo(CustomerBookingsUiState.Ready(listOf(booking)))
        }

    @Test
    public fun `shows error when loading bookings fails`(): Unit =
        runTest {
            every { getBookings() } returns flowOf(Result.failure(IllegalStateException("network")))

            val vm = CustomerBookingsViewModel(getBookings)
            advanceUntilIdle()

            assertThat(vm.uiState.value).isEqualTo(CustomerBookingsUiState.Error)
        }

    private fun sampleBooking(): CustomerBooking =
        CustomerBooking(
            bookingId = "bk-1",
            serviceId = "svc-1",
            serviceName = "AC repair",
            addressText = "101 Ayodhya",
            status = CustomerBookingStatus.ASSIGNED,
            slotDate = "2026-05-05",
            slotWindow = "10:00-12:00",
            amountPaise = 59900,
            paymentMethod = BookingPaymentMethod.CASH_ON_SERVICE,
            createdAt = "2026-05-03T10:00:00.000Z",
        )
}
