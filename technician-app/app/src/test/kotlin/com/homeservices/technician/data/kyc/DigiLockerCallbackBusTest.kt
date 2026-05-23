package com.homeservices.technician.data.kyc

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class DigiLockerCallbackBusTest {
    @Test
    public fun `post sends authCode to events flow`(): Unit =
        runTest {
            val bus = DigiLockerCallbackBus()

            bus.post("auth-code-abc")

            assertThat(bus.events.first()).isEqualTo("auth-code-abc")
        }
}
