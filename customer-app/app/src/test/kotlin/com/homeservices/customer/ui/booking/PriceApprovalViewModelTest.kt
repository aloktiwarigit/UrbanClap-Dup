package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.booking.ApproveFinalPriceUseCase
import com.homeservices.customer.domain.booking.GetPendingAddOnsUseCase
import com.homeservices.customer.domain.booking.model.AddOnDecision
import com.homeservices.customer.domain.booking.model.PendingAddOn
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

@OptIn(ExperimentalCoroutinesApi::class)
public class PriceApprovalViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val getAddOns: GetPendingAddOnsUseCase = mockk()
    private val approve: ApproveFinalPriceUseCase = mockk()
    private val addOns = listOf(PendingAddOn("Gas refill", 120000, "Low pressure"))

    @Before public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @After public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun vm() = PriceApprovalViewModel(getAddOns, approve)

    @Test
    public fun `initial state is Loading`(): Unit =
        runTest(dispatcher) {
            assertThat(vm().uiState.value).isInstanceOf(PriceApprovalUiState.Loading::class.java)
        }

    @Test
    public fun `loadAddOns success transitions to PendingApproval`(): Unit =
        runTest(dispatcher) {
            every { getAddOns("bk-1") } returns flowOf(Result.success(addOns))
            val v = vm()
            v.loadAddOns("bk-1")
            val state = v.uiState.value as PriceApprovalUiState.PendingApproval
            assertThat(state.addOns).isEqualTo(addOns)
        }

    @Test
    public fun `submitDecisions success transitions to Approved`(): Unit =
        runTest(dispatcher) {
            every { getAddOns("bk-1") } returns flowOf(Result.success(addOns))
            every { approve("bk-1", any()) } returns flowOf(Result.success(179900))
            val v = vm()
            v.loadAddOns("bk-1")
            v.submitDecisions("bk-1", listOf(AddOnDecision("Gas refill", approved = true)))
            assertThat((v.uiState.value as PriceApprovalUiState.Approved).finalAmount).isEqualTo(179900)
        }

    @Test
    public fun `loadAddOns failure transitions to Error`(): Unit =
        runTest(dispatcher) {
            every { getAddOns(any()) } returns flowOf(Result.failure(RuntimeException("not found")))
            val v = vm()
            v.loadAddOns("bk-1")
            assertThat(v.uiState.value).isInstanceOf(PriceApprovalUiState.Error::class.java)
        }
}
