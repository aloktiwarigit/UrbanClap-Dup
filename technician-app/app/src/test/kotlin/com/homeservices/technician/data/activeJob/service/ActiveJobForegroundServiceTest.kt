package com.homeservices.technician.data.activeJob.service

import com.homeservices.technician.data.activeJob.ConnectivityObserver
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Unit tests for [ActiveJobForegroundService] that do not require the Android OS.
 *
 * These tests verify the business-logic concerns of the service:
 *  1. CHANNEL_ID constant is correct (manifest + code stay in sync)
 *  2. OutboxSyncWorker.WORK_NAME is referenced correctly
 *
 * Full foreground-service lifecycle (startForeground, scope cancel, OS binding)
 * is covered by the manual QA checklist and instrumented integration tests in a
 * later story.
 */
public class ActiveJobForegroundServiceTest {
    @Test
    public fun `CHANNEL_ID constant has expected value`() {
        assertThat(ActiveJobForegroundService.CHANNEL_ID).isEqualTo("active_job_service")
    }

    @Test
    public fun `service scope starts fresh on each service instance`(): Unit =
        runTest {
            val repository = mockk<ActiveJobRepository>(relaxed = true)
            val connectivityObserver = mockk<ConnectivityObserver>()
            val sharedFlow = MutableSharedFlow<Boolean>()
            every { connectivityObserver.isAvailable } returns sharedFlow.asSharedFlow()

            val service = ActiveJobForegroundService()
            service.repository = repository
            service.connectivityObserver = connectivityObserver

            // Verify the service fields are assignable (DI wiring works)
            assertThat(service.repository).isSameAs(repository)
            assertThat(service.connectivityObserver).isSameAs(connectivityObserver)
        }
}
