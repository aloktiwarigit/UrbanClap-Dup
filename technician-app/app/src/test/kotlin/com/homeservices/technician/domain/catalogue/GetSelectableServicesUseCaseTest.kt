package com.homeservices.technician.domain.catalogue

import com.homeservices.technician.domain.catalogue.model.SelectableService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

public class GetSelectableServicesUseCaseTest {
    private class FakeRepository(
        private val result: Result<List<SelectableService>>,
    ) : CatalogueRepository {
        override suspend fun getSelectableServices(): Result<List<SelectableService>> = result
    }

    @Test
    public fun `returns services from the repository`(): Unit =
        runTest {
            val expected = listOf(SelectableService("ac-deep-clean", "AC Deep Clean", "AC Repair"))
            val useCase = GetSelectableServicesUseCase(FakeRepository(Result.success(expected)))

            assertEquals(expected, useCase().getOrNull())
        }

    @Test
    public fun `propagates failure rather than swallowing it`(): Unit =
        runTest {
            val useCase = GetSelectableServicesUseCase(FakeRepository(Result.failure(IllegalStateException("boom"))))

            assertTrue(useCase().isFailure)
        }
}
