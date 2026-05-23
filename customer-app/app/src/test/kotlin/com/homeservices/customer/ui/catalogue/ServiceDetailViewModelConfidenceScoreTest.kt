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
 * Verifies that [ServiceDetailViewModel] fetches real GPS from [FusedCurrentLocationProvider]
 * on init and passes the coordinates to [GetConfidenceScoreUseCase].
 *
 * Fallback: when GPS returns null (permission denied / unavailable), (0.0, 0.0) is used.
 * Exception handling: if [FusedCurrentLocationProvider.getLastLocation] throws, fall back to (0.0, 0.0).
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class ServiceDetailViewModelConfidenceScoreTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val serviceDetailUseCase: GetServiceDetailUseCase = mockk()
    private val confidenceScoreUseCase: GetConfidenceScoreUseCase = mockk()
    private val locationProvider: FusedCurrentLocationProvider = mockk()
    private val localizer = CatalogueLocalizer()
    private val getCurrentLocale: GetCurrentLocaleUseCase = mockk()

    private val testService =
        Service(
            id = "svc1",
            categoryId = "cat1",
            name = "Pipe Fix",
            description = "Full pipe replacement",
            basePrice = 150000,
            durationMinutes = 120,
            imageUrl = "url",
            includes = listOf("Labour", "Parts"),
            addOns = emptyList<AddOn>(),
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

    @Test
    public fun `GPS fetched on init and passed to GetConfidenceScoreUseCase`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(87, 4.5, 8, 42, false)
            coEvery { locationProvider.getLastLocation() } returns Pair(26.793, 82.194)
            every { confidenceScoreUseCase("tech-1", 26.793, 82.194) } returns flowOf(Result.success(score))

            buildVm(techId = "tech-1")

            coVerify { locationProvider.getLastLocation() }
        }

    @Test
    public fun `null GPS falls back to (0,0) sentinel`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(0, null, null, 5, true)
            coEvery { locationProvider.getLastLocation() } returns null
            every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))

            buildVm(techId = "tech-1")

            coVerify { locationProvider.getLastLocation() }
        }

    @Test
    public fun `GPS not fetched when techId is absent`(): Unit =
        runTest(dispatcher) {
            val vm = buildVm(techId = null)

            coVerify(exactly = 0) { locationProvider.getLastLocation() }
            assertThat(vm.confidenceScoreState.value).isEqualTo(ConfidenceScoreUiState.Hidden)
        }

    @Test
    public fun `GPS exception falls back to (0,0) gracefully`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(75, null, null, 10, false)
            coEvery { locationProvider.getLastLocation() } throws SecurityException("no permission")
            every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))

            val vm = buildVm(techId = "tech-1")

            // Must not crash; score should be Loaded from fallback coords
            assertThat(vm.confidenceScoreState.value)
                .isInstanceOf(ConfidenceScoreUiState.Loaded::class.java)
        }

    @Test
    public fun `Loaded confidence score emitted when GPS is available`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(92, 4.8, 10, 55, false)
            coEvery { locationProvider.getLastLocation() } returns Pair(26.793, 82.194)
            every { confidenceScoreUseCase("tech-1", 26.793, 82.194) } returns flowOf(Result.success(score))

            val vm = buildVm(techId = "tech-1")

            assertThat(vm.confidenceScoreState.value)
                .isInstanceOf(ConfidenceScoreUiState.Loaded::class.java)
            assertThat((vm.confidenceScoreState.value as ConfidenceScoreUiState.Loaded).score.onTimePercent)
                .isEqualTo(92)
        }

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
