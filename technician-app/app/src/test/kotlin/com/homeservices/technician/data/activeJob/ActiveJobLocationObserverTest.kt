package com.homeservices.technician.data.activeJob

import android.content.Context
import com.homeservices.technician.data.location.service.LocationForegroundService
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkObject
import io.mockk.verify
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * Unit tests for [ActiveJobLocationObserver].
 *
 * Each test sets the desired [ActiveJobStatus] on [activeJobState] BEFORE calling [start]
 * so that the StateFlow's immediate replay emission is the value under test — no warm-up
 * emit noise.
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class ActiveJobLocationObserverTest {
    private lateinit var context: Context
    private lateinit var repository: ActiveJobRepository
    private lateinit var activeJobState: MutableStateFlow<ActiveJob?>
    private lateinit var observer: ActiveJobLocationObserver

    private fun aJob(status: ActiveJobStatus): ActiveJob =
        ActiveJob(
            bookingId = "bk-test-1",
            customerId = "c-1",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "12 Main St",
            addressLatLng = LatLng(26.8, 82.2),
            status = status,
            slotDate = "2026-05-01",
            slotWindow = "10:00-12:00",
        )

    private val testDispatcher = UnconfinedTestDispatcher()

    @BeforeEach
    public fun setUp() {
        context = mockk(relaxed = true)
        repository = mockk()
        // Default initial state: no active job — overridden per test before start().
        activeJobState = MutableStateFlow(null)
        every { repository.activeJobState } returns activeJobState

        mockkObject(LocationForegroundService.Companion)
        justRun { LocationForegroundService.startIfNeeded(any(), any()) }
        justRun { LocationForegroundService.stop(any()) }

        observer = ActiveJobLocationObserver(context, repository)
        // Override the observer's default Dispatchers.Default scope with one that uses
        // the TestDispatcher, so `advanceUntilIdle()` actually drains the collect coroutine.
        observer.scope = CoroutineScope(SupervisorJob() + testDispatcher)
    }

    @AfterEach
    public fun tearDown() {
        unmockkObject(LocationForegroundService.Companion)
    }

    @Test
    public fun `observer_emitsEnRoute_startsService`(): Unit =
        runTest(testDispatcher) {
            // Set desired state BEFORE start() so the replay emission is EN_ROUTE.
            activeJobState.value = aJob(ActiveJobStatus.EN_ROUTE)
            observer.start()
            advanceUntilIdle()

            verify(exactly = 1) { LocationForegroundService.startIfNeeded(context, "bk-test-1") }
            verify(exactly = 0) { LocationForegroundService.stop(any()) }
        }

    @Test
    public fun `observer_emitsReached_startsService`(): Unit =
        runTest(testDispatcher) {
            activeJobState.value = aJob(ActiveJobStatus.REACHED)
            observer.start()
            advanceUntilIdle()

            verify(exactly = 1) { LocationForegroundService.startIfNeeded(context, "bk-test-1") }
            verify(exactly = 0) { LocationForegroundService.stop(any()) }
        }

    @Test
    public fun `observer_emitsInProgress_startsService`(): Unit =
        runTest(testDispatcher) {
            activeJobState.value = aJob(ActiveJobStatus.IN_PROGRESS)
            observer.start()
            advanceUntilIdle()

            verify(exactly = 1) { LocationForegroundService.startIfNeeded(context, "bk-test-1") }
            verify(exactly = 0) { LocationForegroundService.stop(any()) }
        }

    @Test
    public fun `observer_emitsCompleted_stopsService`(): Unit =
        runTest(testDispatcher) {
            activeJobState.value = aJob(ActiveJobStatus.COMPLETED)
            observer.start()
            advanceUntilIdle()

            verify(exactly = 1) { LocationForegroundService.stop(context) }
            verify(exactly = 0) { LocationForegroundService.startIfNeeded(any(), any()) }
        }

    @Test
    public fun `observer_emitsNull_stopsService`(): Unit =
        runTest(testDispatcher) {
            // activeJobState is already null from setUp() — replay emits null immediately.
            observer.start()
            advanceUntilIdle()

            verify(exactly = 1) { LocationForegroundService.stop(context) }
            verify(exactly = 0) { LocationForegroundService.startIfNeeded(any(), any()) }
        }

    @Test
    public fun `observer_emitsAssigned_doesNothing`(): Unit =
        runTest(testDispatcher) {
            activeJobState.value = aJob(ActiveJobStatus.ASSIGNED)
            observer.start()
            advanceUntilIdle()

            verify(exactly = 0) { LocationForegroundService.startIfNeeded(any(), any()) }
            verify(exactly = 0) { LocationForegroundService.stop(any()) }
        }

    @Test
    public fun `observer_transitionsFromEnRouteToCompleted_stopsService`(): Unit =
        runTest(testDispatcher) {
            // Verify that a mid-job transition from active to completed stops the service.
            activeJobState.value = aJob(ActiveJobStatus.EN_ROUTE)
            observer.start()
            advanceUntilIdle()

            clearMocks(LocationForegroundService.Companion, answers = false, recordedCalls = true)
            justRun { LocationForegroundService.startIfNeeded(any(), any()) }
            justRun { LocationForegroundService.stop(any()) }

            activeJobState.value = aJob(ActiveJobStatus.COMPLETED)
            advanceUntilIdle()

            verify(exactly = 1) { LocationForegroundService.stop(context) }
            verify(exactly = 0) { LocationForegroundService.startIfNeeded(any(), any()) }
        }
}
