package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.location.FusedCurrentLocationProvider
import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
import com.homeservices.customer.domain.catalogue.GetServiceDetailUseCase
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.customer.domain.technician.GetConfidenceScoreUseCase
import com.homeservices.customer.domain.technician.model.ConfidenceScore
import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
import io.mockk.coEvery
import io.mockk.coVerify
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

/**
 * TDD: GPS is fetched on ViewModel init and forwarded to [GetConfidenceScoreUseCase].
 * Null GPS (permission denied / unavailable) falls back to (0.0, 0.0).
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class ServiceDetailViewModelGpsConfidenceTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val serviceDetailUseCase: GetServiceDetailUseCase = mockk()
    private val confidenceScoreUseCase: GetConfidenceScoreUseCase = mockk()
    private val locationProvider: FusedCurrentLocationProvider = mockk()
    private val localizer = CatalogueLocalizer()
    private val getCurrentLocale: GetCurrentLocaleUseCase = mockk()

    private val testService =
        Service(
            "svc1",
            "cat1",
            "Pipe Fix",
            "Full pipe replacement",
            150000,
            120,
            "url",
            listOf("Labour", "Parts"),
            emptyList<AddOn>(),
        )

    @Before
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
        every { getCurrentLocale() } returns flowOf("en")
        every { serviceDetailUseCase("svc1") } returns flowOf(Result.success(testService))
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: Real GPS coords are fetched and passed to GetConfidenceScoreUseCase
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    public fun `GPS is fetched on init and passed to confidence score use case`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(90, 4.5, 8, 40, false)
            coEvery { locationProvider.getLastLocation() } returns Pair(28.6139, 77.2090)
            every {
                confidenceScoreUseCase("tech-1", 28.6139, 77.2090)
            } returns flowOf(Result.success(score))

            val vm = buildVm(techId = "tech-1")

            coVerify { locationProvider.getLastLocation() }
            assertThat(vm.confidenceScoreState.value)
                .isInstanceOf(ConfidenceScoreUiState.Loaded::class.java)
            assertThat((vm.confidenceScoreState.value as ConfidenceScoreUiState.Loaded).score)
                .isEqualTo(score)
        }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: Null GPS (permission denied) falls back to (0.0, 0.0)
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    public fun `null GPS falls back to sentinel 0 0 and still loads score`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(80, null, null, 20, false)
            coEvery { locationProvider.getLastLocation() } returns null
            every {
                confidenceScoreUseCase("tech-2", 0.0, 0.0)
            } returns flowOf(Result.success(score))

            val vm = buildVm(techId = "tech-2")

            coVerify { locationProvider.getLastLocation() }
            assertThat(vm.confidenceScoreState.value)
                .isInstanceOf(ConfidenceScoreUiState.Loaded::class.java)
        }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: GPS is not called when techId is absent (Hidden state)
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    public fun `GPS is not fetched when techId is absent`(): Unit =
        runTest(dispatcher) {
            val vm = buildVm(techId = null)

            coVerify(exactly = 0) { locationProvider.getLastLocation() }
            assertThat(vm.confidenceScoreState.value)
                .isInstanceOf(ConfidenceScoreUiState.Hidden::class.java)
        }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: GPS exception falls back to (0.0, 0.0) — service must not crash
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    public fun `GPS exception falls back to 0 0 gracefully`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(75, null, null, 10, false)
            coEvery { locationProvider.getLastLocation() } throws SecurityException("no permission")
            every {
                confidenceScoreUseCase("tech-3", 0.0, 0.0)
            } returns flowOf(Result.success(score))

            val vm = buildVm(techId = "tech-3")

            // Should recover — score is still Loaded (not crashed or Hidden)
            assertThat(vm.confidenceScoreState.value)
                .isInstanceOf(ConfidenceScoreUiState.Loaded::class.java)
        }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private fun buildVm(techId: String?): ServiceDetailViewModel {
        val handle =
            if (techId != null) {
                SavedStateHandle(mapOf("serviceId" to "svc1", "techId" to techId))
            } else {
                SavedStateHandle(mapOf("serviceId" to "svc1"))
            }
        return ServiceDetailViewModel(
            savedStateHandle = handle,
            getServiceDetail = serviceDetailUseCase,
            getConfidenceScore = confidenceScoreUseCase,
            locationProvider = locationProvider,
            localizer = localizer,
            getCurrentLocale = getCurrentLocale,
            analytics = NoOpAnalyticsFacade(),
        )
    }
}
