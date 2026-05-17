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
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@OptIn(ExperimentalCoroutinesApi::class)
public class SlotPickerViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val getSlots: GetSlotAvailabilityUseCase = mockk()

    // Frozen IST clock at 2026-05-20 10:30 IST (= 05:00 UTC). Eliminates time-of-day flakiness.
    private val istZone: ZoneId = ZoneId.of("Asia/Kolkata")
    private val frozenClock: Clock = Clock.fixed(Instant.parse("2026-05-20T05:00:00Z"), istZone)

    private val today: LocalDate = LocalDate.of(2026, 5, 20)
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

    private fun vm() = SlotPickerViewModel(getSlots, frozenClock)

    @Test
    public fun `initial state is Loading`(): Unit =
        runTest(dispatcher) {
            assertThat(vm().uiState.value).isInstanceOf(SlotPickerUiState.Loading::class.java)
        }

    @Test
    public fun `currentIstDate returns the clock's date`(): Unit =
        runTest(dispatcher) {
            assertThat(vm().currentIstDate()).isEqualTo(today)
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
    public fun `past-time filter marks slots whose start minute is at or before now as unavailable today`(): Unit =
        runTest(dispatcher) {
            // Clock is 10:30 IST. Elapsed: 00:00-02:00, 08:00-10:00, 10:30-11:00 (>= 10:30? no, exactly).
            // Future: 11:00-12:00, 14:00-16:00.
            val past1 = slot("00:00-02:00")
            val past2 = slot("08:00-10:00")
            val borderline = slot("10:30-11:00") // start == now → treated as past per <= filter
            val future1 = slot("11:00-12:00")
            val future2 = slot("14:00-16:00")
            every { getSlots(serviceId, today) } returns
                flowOf(Result.success(listOf(past1, past2, borderline, future1, future2)))

            val v = vm()
            v.loadSlots(serviceId, today)

            val state = v.uiState.value as SlotPickerUiState.Loaded
            assertThat(state.filteredSlots.first { it.window == past1.window }.available).isFalse()
            assertThat(state.filteredSlots.first { it.window == past2.window }.available).isFalse()
            assertThat(state.filteredSlots.first { it.window == borderline.window }.available).isFalse()
            assertThat(state.filteredSlots.first { it.window == future1.window }.available).isTrue()
            assertThat(state.filteredSlots.first { it.window == future2.window }.available).isTrue()
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
            verify(atLeast = 2) { getSlots(serviceId, tomorrow) }
        }

    @Test
    public fun `retry uses the most recent requested date when user changed dates`(): Unit =
        runTest(dispatcher) {
            val later = tomorrow.plusDays(1)
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.success(listOf(slot("11:00-12:00"))))
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
            val s = slot("11:00-12:00")
            every { getSlots(serviceId, tomorrow) } returns flowOf(Result.success(listOf(s)))
            val v = vm()
            v.loadSlots(serviceId, tomorrow)
            v.selectSlot(s)

            val later = tomorrow.plusDays(1)
            every { getSlots(serviceId, later) } returns flowOf(Result.success(listOf(s)))
            v.loadSlots(serviceId, later)

            assertThat((v.uiState.value as SlotPickerUiState.Loaded).selected).isNull()
        }

    @Test
    public fun `ensureInitialLoad loads on first call`(): Unit =
        runTest(dispatcher) {
            val s = slot("11:00-12:00")
            every { getSlots(serviceId, today) } returns flowOf(Result.success(listOf(s)))

            val v = vm()
            v.ensureInitialLoad(serviceId)

            verify(exactly = 1) { getSlots(serviceId, today) }
            assertThat((v.uiState.value as SlotPickerUiState.Loaded).date).isEqualTo(today)
        }

    @Test
    public fun `ensureInitialLoad is a no-op when same serviceId already loaded`(): Unit =
        runTest(dispatcher) {
            val s = slot("11:00-12:00")
            every { getSlots(serviceId, today) } returns flowOf(Result.success(listOf(s)))
            val v = vm()
            v.ensureInitialLoad(serviceId)
            v.selectSlot(s)

            v.ensureInitialLoad(serviceId)

            // No second call; selection preserved.
            verify(exactly = 1) { getSlots(serviceId, today) }
            assertThat((v.uiState.value as SlotPickerUiState.Loaded).selected).isEqualTo(s)
        }

    @Test
    public fun `ensureInitialLoad reloads when serviceId changes`(): Unit =
        runTest(dispatcher) {
            every { getSlots(serviceId, today) } returns flowOf(Result.success(listOf(slot("11:00-12:00"))))
            every { getSlots("svc-2", today) } returns flowOf(Result.success(listOf(slot("14:00-16:00"))))

            val v = vm()
            v.ensureInitialLoad(serviceId)
            v.ensureInitialLoad("svc-2")

            verify(exactly = 1) { getSlots(serviceId, today) }
            verify(exactly = 1) { getSlots("svc-2", today) }
        }
}
