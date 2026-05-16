package com.homeservices.technician.ui.dashboard

import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.domain.auth.model.AuthProvider
import com.homeservices.technician.domain.auth.model.AuthState
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * TDD — [TechnicianDashboardViewModel] (E11-S04 WS-C).
 *
 * Verifies: dashboard-type filtering, priority ordering, reconcile delegates to
 * store cleanup. Manual MockK construction per [docs/patterns/hilt-module-android-test-scope.md].
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class TechnicianDashboardViewModelTest {

    private val dispatcher = UnconfinedTestDispatcher()
    private val pendingActionStore: PendingActionStore = mockk(relaxed = true)
    private val sessionManager: SessionManager = mockk()

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun buildViewModel(): TechnicianDashboardViewModel =
        TechnicianDashboardViewModel(
            pendingActionStore = pendingActionStore,
            sessionManager = sessionManager,
        )

    private fun makeAction(
        id: String,
        type: PendingActionType,
        priority: PendingActionPriority = PendingActionPriority.NORMAL,
        createdAt: Long = 1_000L,
    ): PendingAction =
        PendingAction(
            id = id,
            userId = "tech-1",
            role = "technician",
            type = type,
            entityType = "booking",
            entityId = "bk-$id",
            routeUri = "homeservices://action/${type.name}?entityId=bk-$id",
            priority = priority,
            status = PendingActionStatus.ACTIVE,
            sourceStatus = null,
            version = 1L,
            createdAt = createdAt,
            updatedAt = createdAt,
            expiresAt = null,
            resolvedAt = null,
        )

    private fun authenticatedState() =
        MutableStateFlow(
            AuthState.Authenticated("tech-1", null, null, null, AuthProvider.Phone),
        )

    // ── Filtering ─────────────────────────────────────────────────────────────

    @Test
    public fun `only dashboard-relevant action types are emitted`(): Unit =
        runTest(dispatcher) {
            val dashboardAction = makeAction("d1", PendingActionType.JOB_OFFER)
            val nonDashboardAction = makeAction("n1", PendingActionType.KYC_RESUME)
            every { sessionManager.authState } returns authenticatedState()
            every { pendingActionStore.observeActive("tech-1") } returns
                flowOf(listOf(dashboardAction, nonDashboardAction))

            val vm = buildViewModel()

            val emitted = vm.pendingActions.value
            assertThat(emitted).hasSize(1)
            assertThat(emitted.first().id).isEqualTo("d1")
        }

    @Test
    public fun `all five dashboard types are included when present`(): Unit =
        runTest(dispatcher) {
            val actions = listOf(
                makeAction("a1", PendingActionType.JOB_OFFER),
                makeAction("a2", PendingActionType.RATING_PROMPT_TECHNICIAN),
                makeAction("a3", PendingActionType.RATING_RECEIVED),
                makeAction("a4", PendingActionType.EARNINGS_UPDATE),
            )
            every { sessionManager.authState } returns authenticatedState()
            every { pendingActionStore.observeActive("tech-1") } returns flowOf(actions)

            val vm = buildViewModel()

            assertThat(vm.pendingActions.value).hasSize(4)
        }

    @Test
    public fun `complaint and kyc types are filtered out`(): Unit =
        runTest(dispatcher) {
            val actions = listOf(
                makeAction("c1", PendingActionType.COMPLAINT_UPDATE),
                makeAction("k1", PendingActionType.KYC_RESUME),
                makeAction("s1", PendingActionType.SUPPORT_FOLLOWUP),
                makeAction("job1", PendingActionType.JOB_OFFER),
            )
            every { sessionManager.authState } returns authenticatedState()
            every { pendingActionStore.observeActive("tech-1") } returns flowOf(actions)

            val vm = buildViewModel()

            val types = vm.pendingActions.value.map { it.type }
            assertThat(types).containsExactly(PendingActionType.JOB_OFFER)
        }

    // ── Priority ordering ─────────────────────────────────────────────────────

    @Test
    public fun `HIGH priority actions appear before LOW priority actions`(): Unit =
        runTest(dispatcher) {
            val actions = listOf(
                makeAction("low1", PendingActionType.EARNINGS_UPDATE, PendingActionPriority.LOW),
                makeAction("high1", PendingActionType.JOB_OFFER, PendingActionPriority.HIGH),
                makeAction("norm1", PendingActionType.RATING_PROMPT_TECHNICIAN, PendingActionPriority.NORMAL),
            )
            every { sessionManager.authState } returns authenticatedState()
            every { pendingActionStore.observeActive("tech-1") } returns flowOf(actions)

            val vm = buildViewModel()

            val priorities = vm.pendingActions.value.map { it.priority }
            assertThat(priorities.first()).isEqualTo(PendingActionPriority.HIGH)
            assertThat(priorities.last()).isEqualTo(PendingActionPriority.LOW)
        }

    @Test
    public fun `within same priority older actions appear first`(): Unit =
        runTest(dispatcher) {
            val actions = listOf(
                makeAction("newer", PendingActionType.JOB_OFFER, PendingActionPriority.NORMAL, createdAt = 2_000L),
                makeAction("older", PendingActionType.EARNINGS_UPDATE, PendingActionPriority.NORMAL, createdAt = 1_000L),
            )
            every { sessionManager.authState } returns authenticatedState()
            every { pendingActionStore.observeActive("tech-1") } returns flowOf(actions)

            val vm = buildViewModel()

            assertThat(vm.pendingActions.value.first().id).isEqualTo("older")
        }

    // ── Unauthenticated state ─────────────────────────────────────────────────

    @Test
    public fun `unauthenticated session emits empty list`(): Unit =
        runTest(dispatcher) {
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Unauthenticated)

            val vm = buildViewModel()

            assertThat(vm.pendingActions.value).isEmpty()
        }

    // ── Reconcile ─────────────────────────────────────────────────────────────

    @Test
    public fun `reconcile triggers store purgeExpired`(): Unit =
        runTest(dispatcher) {
            every { sessionManager.authState } returns authenticatedState()
            every { pendingActionStore.observeActive("tech-1") } returns flowOf(emptyList())

            val vm = buildViewModel()
            vm.reconcile()

            coVerify { pendingActionStore.purgeExpired(any()) }
        }

    @Test
    public fun `reconcile triggers store purgeTombstones`(): Unit =
        runTest(dispatcher) {
            every { sessionManager.authState } returns authenticatedState()
            every { pendingActionStore.observeActive("tech-1") } returns flowOf(emptyList())

            val vm = buildViewModel()
            vm.reconcile()

            coVerify { pendingActionStore.purgeTombstones(any()) }
        }
}
