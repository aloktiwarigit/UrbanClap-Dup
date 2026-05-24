package com.homeservices.technician.data.fcm

import android.content.Context
import androidx.work.ListenableWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.homeservices.technician.data.device.DeviceTokenRegistrar
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * Unit tests for [FcmTokenRegisterWorker.doWork].
 *
 * [WorkerParameters] is mocked fully relaxed so [CoroutineWorker]'s parent constructor
 * gets a non-null executor from `params.taskExecutor`.
 * We call [doWork] directly as a suspend function, bypassing the WorkManager executor.
 *
 * Note: `work-testing` (TestListenableWorkerBuilder) is defined in libs.versions.toml
 * but not wired into build.gradle.kts testImplementation. Direct constructor instantiation
 * via mockk mirrors the pattern used in [OutboxSyncWorkerTest].
 */
public class FcmTokenRegisterWorkerTest {
    private lateinit var context: Context
    private lateinit var workerParams: WorkerParameters
    private lateinit var fcmTokenSyncUseCase: FcmTokenSyncUseCase
    private lateinit var deviceTokenRegistrar: DeviceTokenRegistrar

    @BeforeEach
    public fun setUp() {
        context = mockk(relaxed = true)
        workerParams = mockk(relaxed = true)
        fcmTokenSyncUseCase = mockk(relaxed = true)
        deviceTokenRegistrar = mockk(relaxed = true)
    }

    private fun buildWorker(
        runAttemptCount: Int = 0,
        token: String? = "test-fcm-token",
    ): FcmTokenRegisterWorker {
        every { workerParams.runAttemptCount } returns runAttemptCount
        every { workerParams.inputData } returns
            if (token != null) workDataOf(FcmTokenRegisterWorker.KEY_FCM_TOKEN to token) else workDataOf()
        return FcmTokenRegisterWorker(context, workerParams, fcmTokenSyncUseCase, deviceTokenRegistrar)
    }

    @Test
    public fun `doWork returns failure when token input is missing`(): Unit =
        runTest {
            val worker = buildWorker(token = null)

            val result = worker.doWork()

            assertThat(result).isEqualTo(ListenableWorker.Result.failure())
            coVerify(exactly = 0) { fcmTokenSyncUseCase.invokeWithFcmToken(any()) }
        }

    @Test
    public fun `doWork returns success on happy path`(): Unit =
        runTest {
            coEvery { fcmTokenSyncUseCase.invokeWithFcmToken("test-fcm-token") } returns Unit
            coEvery { deviceTokenRegistrar.register() } returns Unit
            val worker = buildWorker(runAttemptCount = 0)

            val result = worker.doWork()

            assertThat(result).isEqualTo(ListenableWorker.Result.success())
            coVerify(exactly = 1) { fcmTokenSyncUseCase.invokeWithFcmToken("test-fcm-token") }
            coVerify(exactly = 1) { deviceTokenRegistrar.register() }
        }

    @Test
    public fun `doWork returns retry on exception at runAttemptCount=0`(): Unit =
        runTest {
            coEvery { fcmTokenSyncUseCase.invokeWithFcmToken(any()) } throws RuntimeException("network error")
            val worker = buildWorker(runAttemptCount = 0)

            val result = worker.doWork()

            assertThat(result).isEqualTo(ListenableWorker.Result.retry())
        }

    @Test
    public fun `doWork returns failure on exception at runAttemptCount=3`(): Unit =
        runTest {
            coEvery { fcmTokenSyncUseCase.invokeWithFcmToken(any()) } throws RuntimeException("network error")
            val worker = buildWorker(runAttemptCount = 3)

            val result = worker.doWork()

            assertThat(result).isEqualTo(ListenableWorker.Result.failure())
        }
}
