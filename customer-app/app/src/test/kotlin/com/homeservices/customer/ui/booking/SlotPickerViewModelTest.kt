package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.booking.GetSlotAvailabilityUseCase
import com.homeservices.customer.domain.booking.model.SlotWindow
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.time.LocalDate
import java.time.LocalTime
import java.util.Locale

@OptIn(ExperimentalCoroutinesApi::class)
public class SlotPickerViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val getSlots: GetSlotAvailabilityUseCase = mockk()

    private val today: LocalDate = LocalDate.now()
    private val tomorrow: LocalDate = today.plusDays(1)
    private val serviceId = "svc-1"

    private fun slot(
        window: String,
        available: Boolean = true,
    ): SlotWindow = SlotWindow(window = window, available = available)

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun vm() = SlotPickerViewModel(getSlots)

    @Test
    public fun `initial state is Loading`(): Unit =
        runTest(dispatcher) {
            assertThat(vm().uiState.value).isInstanceOf(SlotPickerUiState.Loading::class.java)
        }

    @Test
    public fun `loadSlots success transitions to Loaded`(): Unit =
        runTest(dispatcher) {
            val slots = listOf(slot("10:00-12:00"), slot("14:00-16:00", available = false))
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.success(slots))

            val v = vm()
            v.loadSlots(serviceId, tomorrow)

            val state = v.uiState.value as SlotPickerUiState.Loaded
            assertThat(state.date).isEqualTo(tomorrow)
            assertThat(state.slots).isEqualTo(slots)
            assertThat(state.selected).isNull()
        }

    @Test
    public fun `loadSlots failure transitions to Error`(): Unit =
        runTest(dispatcher) {
            every { getSlots(any(), any()) } returns flowOf(Result.failure(RuntimeException("boom")))

            val v = vm()
            v.loadSlots(serviceId, tomorrow)

            assertThat(v.uiState.value).isInstanceOf(SlotPickerUiState.Error::class.java)
        }

    @Test
    public fun `past-time filter marks slots before now hour as unavailable today`(): Unit =
        runTest(dispatcher) {
            val nowHour = LocalTime.now().hour
            // Use a slot that starts in the past relative to nowHour. Pick "00:00-02:00" — always elapsed
            // unless the test runs in the very first hour of the day.
            val earlySlot = slot("00:00-02:00", available = true)
            val lateSlot =
                slot(
                    window = String.format(Locale.ROOT, "%02d:00-%02d:00", (nowHour + 1) % 24, (nowHour + 3) % 24),
                    available = true,
                )
            every { getSlots(serviceId, today) } returns flowOf(Result.success(listOf(earlySlot, lateSlot)))

            val v = vm()
            v.loadSlots(serviceId, today)

            val state = v.uiState.value as SlotPickerUiState.Loaded
            val filteredEarly = state.filteredSlots.first { it.window == earlySlot.window }
            assertThat(filteredEarly.available).isFalse()
        }

    @Test
    public fun `past-time filter does not affect future dates`(): Unit =
        runTest(dispatcher) {
            val s = slot("00:00-02:00", available = true)
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.success(listOf(s)))

            val v = vm()
            v.loadSlots(serviceId, tomorrow)

            val state = v.uiState.value as SlotPickerUiState.Loaded
            assertThat(state.filteredSlots.single().available).isTrue()
        }

    @Test
    public fun `selectSlot updates Loaded selected`(): Unit =
        runTest(dispatcher) {
            val s = slot("10:00-12:00")
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.success(listOf(s)))

            val v = vm()
            v.loadSlots(serviceId, tomorrow)
            v.selectSlot(s)

            assertThat((v.uiState.value as SlotPickerUiState.Loaded).selected).isEqualTo(s)
        }

    @Test
    public fun `retry re-triggers load`(): Unit =
        runTest(dispatcher) {
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.failure(RuntimeException("boom")))
            val v = vm()
            v.loadSlots(serviceId, tomorrow)
            assertThat(v.uiState.value).isInstanceOf(SlotPickerUiState.Error::class.java)

            val s = slot("10:00-12:00")
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.success(listOf(s)))
            v.retry(serviceId, tomorrow)

            assertThat(v.uiState.value).isInstanceOf(SlotPickerUiState.Loaded::class.java)
        }

    @Test
    public fun `date change resets selected`(): Unit =
        runTest(dispatcher) {
            val s = slot("10:00-12:00")
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.success(listOf(s)))
            val v = vm()
            v.loadSlots(serviceId, tomorrow)
            v.selectSlot(s)

            val later = tomorrow.plusDays(1)
            every { getSlots(serviceId, later) } returns flowOf(Result.success(listOf(s)))
            v.loadSlots(serviceId, later)

            assertThat((v.uiState.value as SlotPickerUiState.Loaded).selected).isNull()
        }
}
