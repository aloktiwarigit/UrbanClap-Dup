package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
import com.homeservices.customer.domain.catalogue.GetServiceDetailUseCase
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.customer.domain.technician.GetConfidenceScoreUseCase
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

/**
 * Verifies that [ServiceDetailViewModel.recommendedTechnicianId] is correctly exposed so
 * [ServiceDetailScreen] can drive [TrustDossierViewModel]:
 *
 *  - When `techId` is absent from SavedStateHandle → [recommendedTechnicianId] emits null.
 *  - When `techId` is present → [recommendedTechnicianId] emits that id.
 */
@RunWith(JUnit4::class)
@OptIn(ExperimentalCoroutinesApi::class)
public class ServiceDetailTrustDossierTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val serviceDetailUseCase: GetServiceDetailUseCase = mockk()
    private val confidenceScoreUseCase: GetConfidenceScoreUseCase = mockk()
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

    @Test
    public fun `recommendedTechnicianId is null when techId not provided`(): Unit =
        runTest(dispatcher) {
            val vm =
                ServiceDetailViewModel(
                    SavedStateHandle(mapOf("serviceId" to "svc1")),
                    serviceDetailUseCase,
                    confidenceScoreUseCase,
                    localizer,
                    getCurrentLocale,
                )
            assertThat(vm.recommendedTechnicianId.value).isNull()
        }

    @Test
    public fun `recommendedTechnicianId emits techId when provided in SavedStateHandle`(): Unit =
        runTest(dispatcher) {
            val score =
                com.homeservices.customer.domain.technician.model.ConfidenceScore(
                    94,
                    4.7,
                    12,
                    35,
                    false,
                )
            every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))
            val vm =
                ServiceDetailViewModel(
                    SavedStateHandle(mapOf("serviceId" to "svc1", "techId" to "tech-1")),
                    serviceDetailUseCase,
                    confidenceScoreUseCase,
                    localizer,
                    getCurrentLocale,
                )
            assertThat(vm.recommendedTechnicianId.value).isEqualTo("tech-1")
        }
}
