package com.homeservices.customer.ui.wallet

import app.cash.turbine.test
import com.homeservices.customer.data.wallet.NoShowCreditEvent
import com.homeservices.customer.data.wallet.NoShowCreditEventBus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class NoShowCreditViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val eventBus = NoShowCreditEventBus()

    @Before
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `event is null on init`(): Unit =
        runTest {
            val vm = NoShowCreditViewModel(eventBus)
            advanceUntilIdle()
            assertThat(vm.event.value).isNull()
        }

    @Test
    public fun `event emitted when bus posts`(): Unit =
        runTest {
            val vm = NoShowCreditViewModel(eventBus)
            val credit = NoShowCreditEvent(creditAmountPaise = 50000L, bookingId = "bk-1")

            vm.event.test {
                assertThat(awaitItem()).isNull() // initial null
                eventBus.post(credit)
                advanceUntilIdle()
                assertThat(awaitItem()).isEqualTo(credit)
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `dismiss clears event`(): Unit =
        runTest {
            val vm = NoShowCreditViewModel(eventBus)
            val credit = NoShowCreditEvent(creditAmountPaise = 10000L, bookingId = "bk-2")
            eventBus.post(credit)
            advanceUntilIdle()
            assertThat(vm.event.value).isEqualTo(credit)

            vm.dismiss()
            assertThat(vm.event.value).isNull()
        }

    @Test
    public fun `second event replaces first after dismiss`(): Unit =
        runTest {
            val vm = NoShowCreditViewModel(eventBus)
            val first = NoShowCreditEvent(creditAmountPaise = 10000L, bookingId = "bk-1")
            val second = NoShowCreditEvent(creditAmountPaise = 20000L, bookingId = "bk-2")

            eventBus.post(first)
            advanceUntilIdle()
            vm.dismiss()
            eventBus.post(second)
            advanceUntilIdle()

            assertThat(vm.event.value).isEqualTo(second)
        }
}
