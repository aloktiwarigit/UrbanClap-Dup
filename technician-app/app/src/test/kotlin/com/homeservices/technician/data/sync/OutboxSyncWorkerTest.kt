package com.homeservices.technician.data.sync

import android.content.Context
import androidx.work.ListenableWorker
import androidx.work.WorkerParameters
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * Unit tests for [OutboxSyncWorker.doWork].
 *
 * [WorkerParameters] is mocked fully relaxed so [CoroutineWorker]'s parent constructor
 * gets a non-null executor from `params.taskExecutor`.
 * We call [doWork] directly as a suspend function, bypassing the WorkManager executor.
 */
public class OutboxSyncWorkerTest {
    private lateinit var context: Context
    private lateinit var workerParams: WorkerParameters
    private lateinit var repository: ActiveJobRepository

    @BeforeEach
    public fun setUp() {
        context = mockk(relaxed = true)
        workerParams = mockk(relaxed = true)
        repository = mockk(relaxed = true)
    }

    private fun buildWorker(runAttemptCount: Int = 0): OutboxSyncWorker {
        every { workerParams.runAttemptCount } returns runAttemptCount
        return OutboxSyncWorker(context, workerParams, repository)
    }

    @Test
    public fun `doWork success — returns Result success`(): Unit =
        runTest {
            coEvery { repository.syncPendingTransitions() } returns Unit
            val worker = buildWorker(runAttemptCount = 0)

            val result = worker.doWork()

            assertThat(result).isEqualTo(ListenableWorker.Result.success())
            coVerify(exactly = 1) { repository.syncPendingTransitions() }
        }

    @Test
    public fun `doWork exception at runAttemptCount=0 — returns Result retry`(): Unit =
        runTest {
            coEvery { repository.syncPendingTransitions() } throws RuntimeException("network")
            val worker = buildWorker(runAttemptCount = 0)

            val result = worker.doWork()

            assertThat(result).isEqualTo(ListenableWorker.Result.retry())
        }

    @Test
    public fun `doWork exception at runAttemptCount=2 — returns Result retry`(): Unit =
        runTest {
            coEvery { repository.syncPendingTransitions() } throws RuntimeException("network")
            val worker = buildWorker(runAttemptCount = 2)

            val result = worker.doWork()

            assertThat(result).isEqualTo(ListenableWorker.Result.retry())
        }

    @Test
    public fun `doWork exception at runAttemptCount=3 — returns Result failure`(): Unit =
        runTest {
            coEvery { repository.syncPendingTransitions() } throws RuntimeException("network")
            val worker = buildWorker(runAttemptCount = 3)

            val result = worker.doWork()

            assertThat(result).isEqualTo(ListenableWorker.Result.failure())
        }

    @Test
    public fun `WORK_NAME constant has expected value`() {
        assertThat(OutboxSyncWorker.WORK_NAME).isEqualTo("outbox_sync")
    }
}
