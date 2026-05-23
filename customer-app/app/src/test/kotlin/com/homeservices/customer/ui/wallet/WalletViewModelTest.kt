package com.homeservices.customer.ui.wallet

import com.homeservices.customer.domain.wallet.GetWalletBalanceUseCase
import com.homeservices.customer.domain.wallet.GetWalletLedgerUseCase
import com.homeservices.customer.domain.wallet.model.LedgerEntry
import com.homeservices.customer.domain.wallet.model.LedgerEntryType
import com.homeservices.customer.domain.wallet.model.WalletBalance
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class WalletViewModelTest {
    private val dispatcher = StandardTestDispatcher()
    private val getBalance: GetWalletBalanceUseCase = mockk()
    private val getLedger: GetWalletLedgerUseCase = mockk()

    @Before
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `balance loads from API on init`(): Unit =
        runTest {
            val balance = WalletBalance(balanceInPaise = 50000L, lastUpdatedAt = "2026-05-13T10:00:00Z")
            every { getBalance() } returns flowOf(Result.success(balance))
            every { getLedger(any(), any()) } returns flowOf(Result.success(emptyList()))

            val vm = WalletViewModel(getBalance, getLedger)
            advanceUntilIdle()

            assertThat(vm.balanceState.value).isEqualTo(WalletBalanceUiState.Ready(balance))
        }

    @Test
    public fun `ledger loads paginated entries on init`(): Unit =
        runTest {
            val entries = listOf(sampleCreditEntry(), sampleDebitEntry())
            every { getBalance() } returns flowOf(Result.success(WalletBalance(balanceInPaise = 50000L, lastUpdatedAt = "")))
            every { getLedger(any(), any()) } returns flowOf(Result.success(entries))

            val vm = WalletViewModel(getBalance, getLedger)
            advanceUntilIdle()

            assertThat(vm.ledgerState.value).isEqualTo(LedgerUiState.Ready(entries))
        }

    @Test
    public fun `balance shows error state on API failure`(): Unit =
        runTest {
            every { getBalance() } returns flowOf(Result.failure(RuntimeException("network error")))
            every { getLedger(any(), any()) } returns flowOf(Result.success(emptyList()))

            val vm = WalletViewModel(getBalance, getLedger)
            advanceUntilIdle()

            assertThat(vm.balanceState.value).isEqualTo(WalletBalanceUiState.Error)
        }

    @Test
    public fun `ledger shows error state on API failure`(): Unit =
        runTest {
            every { getBalance() } returns flowOf(Result.success(WalletBalance(balanceInPaise = 0L, lastUpdatedAt = "")))
            every { getLedger(any(), any()) } returns flowOf(Result.failure(RuntimeException("network error")))

            val vm = WalletViewModel(getBalance, getLedger)
            advanceUntilIdle()

            assertThat(vm.ledgerState.value).isEqualTo(LedgerUiState.Error)
        }

    private fun sampleCreditEntry(): LedgerEntry =
        LedgerEntry(
            id = "le-1",
            type = LedgerEntryType.CREDIT_ISSUED,
            amountInPaise = 50000L,
            bookingId = null,
            reason = "Welcome bonus",
            createdAt = "2026-05-13T10:00:00Z",
        )

    private fun sampleDebitEntry(): LedgerEntry =
        LedgerEntry(
            id = "le-2",
            type = LedgerEntryType.CREDIT_APPLIED,
            amountInPaise = 10000L,
            bookingId = "bk-1",
            reason = "Applied to booking",
            createdAt = "2026-05-13T12:00:00Z",
        )
}
