package com.homeservices.technician.ui.home

import com.homeservices.technician.domain.jobs.GetTechnicianBookingsUseCase
import com.homeservices.technician.domain.jobs.model.TechnicianBooking
import com.homeservices.technician.domain.jobs.model.TechnicianBookingStatus
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
public class TechnicianHomeViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val getBookings: GetTechnicianBookingsUseCase = mockk()

    private val booking =
        TechnicianBooking(
            bookingId = "bk-1",
            serviceId = "ac-deep-clean",
            serviceName = "AC deep clean",
            addressText = "101 Ayodhya",
            status = TechnicianBookingStatus.IN_PROGRESS,
            slotDate = "2026-05-05",
            slotWindow = "10:00-12:00",
            amountPaise = 99900L,
        )

    @BeforeEach
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `init loads bookings and transitions to Ready`(): Unit =
        runTest {
            coEvery { getBookings.invoke() } returns Result.success(listOf(booking))

            val vm = TechnicianHomeViewModel(getBookings)

            assertInstanceOf(TechnicianHomeUiState.Ready::class.java, vm.uiState.value)
            assertEquals(listOf(booking), (vm.uiState.value as TechnicianHomeUiState.Ready).bookings)
        }

    @Test
    public fun `init 401 failure explains expired session`(): Unit =
        runTest {
            coEvery { getBookings.invoke() } returns Result.failure(httpException(401))

            val vm = TechnicianHomeViewModel(getBookings)

            assertEquals(
                TechnicianHomeUiState.Error("Session expired. Sign out and sign in again to refresh jobs."),
                vm.uiState.value,
            )
        }

    @Test
    public fun `init network failure explains connection issue`(): Unit =
        runTest {
            coEvery { getBookings.invoke() } returns Result.failure(IOException("timeout"))

            val vm = TechnicianHomeViewModel(getBookings)

            assertEquals(
                TechnicianHomeUiState.Error("Network unavailable. Check your connection and retry."),
                vm.uiState.value,
            )
        }

    @Test
    public fun `refresh reloads bookings`(): Unit =
        runTest {
            coEvery { getBookings.invoke() } returns Result.success(listOf(booking))
            val vm = TechnicianHomeViewModel(getBookings)

            vm.refresh()

            coVerify(exactly = 2) { getBookings.invoke() }
        }

    private fun httpException(code: Int): HttpException {
        val body = "".toResponseBody(null)
        return HttpException(Response.error<Unit>(code, body))
    }
}
