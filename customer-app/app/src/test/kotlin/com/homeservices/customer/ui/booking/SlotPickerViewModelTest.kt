package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.booking.GetSlotAvailabilityUseCase
import com.homeservices.customer.domain.booking.model.SlotWindow
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
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
    public fun `past-time filter marks slots whose start minute is before now as unavailable today`(): Unit =
        runTest(dispatcher) {
            val nowMinute = LocalTime.now().toSecondOfDay() / SECONDS_PER_MINUTE
            // Past slot — always elapsed unless the test is in the very first minutes of the day.
            val earlySlot = slot("00:00-02:00", available = true)
            val futureStartMinute = (nowMinute + LOOK_AHEAD_MINUTES) % MINUTES_PER_DAY
            val futureSlot =
                slot(
                    window =
                        String.format(
                            Locale.ROOT,
                            "%02d:%02d-%02d:%02d",
                            futureStartMinute / MINUTES_PER_HOUR,
                            futureStartMinute % MINUTES_PER_HOUR,
                            ((futureStartMinute + WINDOW_LENGTH_MINUTES) / MINUTES_PER_HOUR) % HOURS_PER_DAY,
                            (futureStartMinute + WINDOW_LENGTH_MINUTES) % MINUTES_PER_HOUR,
                        ),
                    available = true,
                )
            every { getSlots(serviceId, today) } returns flowOf(Result.success(listOf(earlySlot, futureSlot)))

            val v = vm()
            v.loadSlots(serviceId, today)

            val state = v.uiState.value as SlotPickerUiState.Loaded
            val filteredEarly = state.filteredSlots.first { it.window == earlySlot.window }
            assertThat(filteredEarly.available).isFalse()
            val filteredFuture = state.filteredSlots.first { it.window == futureSlot.window }
            assertThat(filteredFuture.available).isTrue()
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
    public fun `retry re-triggers load for the last requested date`(): Unit =
        runTest(dispatcher) {
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.failure(RuntimeException("boom")))
            val v = vm()
            v.loadSlots(serviceId, tomorrow)
            assertThat(v.uiState.value).isInstanceOf(SlotPickerUiState.Error::class.java)

            val s = slot("10:00-12:00")
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.success(listOf(s)))
            v.retry()

            val state = v.uiState.value as SlotPickerUiState.Loaded
            assertThat(state.date).isEqualTo(tomorrow)
            // retry must reload the date that failed, not today
            verify(atLeast = 2) { getSlots(serviceId, tomorrow) }
        }

    @Test
    public fun `retry uses the most recent requested date when user changed dates`(): Unit =
        runTest(dispatcher) {
            val later = tomorrow.plusDays(1)
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.success(listOf(slot("10:00-12:00"))))
            every { getSlots(serviceId, later) } returns flowOf(Result.failure(RuntimeException("boom")))
            val v = vm()
            v.loadSlots(serviceId, tomorrow)
            v.loadSlots(serviceId, later)
            assertThat(v.uiState.value).isInstanceOf(SlotPickerUiState.Error::class.java)

            every { getSlots(serviceId, later) } returns flowOf(Result.success(listOf(slot("14:00-16:00"))))
            v.retry()

            val state = v.uiState.value as SlotPickerUiState.Loaded
            assertThat(state.date).isEqualTo(later)
        }

    @Test
    public fun `retry is a no-op before any load`(): Unit =
        runTest(dispatcher) {
            val v = vm()
            v.retry()
            assertThat(v.uiState.value).isInstanceOf(SlotPickerUiState.Loading::class.java)
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

private const val SECONDS_PER_MINUTE = 60
private const val MINUTES_PER_HOUR = 60
private const val HOURS_PER_DAY = 24
private const val MINUTES_PER_DAY = MINUTES_PER_HOUR * HOURS_PER_DAY
private const val LOOK_AHEAD_MINUTES = 90
private const val WINDOW_LENGTH_MINUTES = 60
