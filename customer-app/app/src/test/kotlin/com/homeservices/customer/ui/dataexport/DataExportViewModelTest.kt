package com.homeservices.customer.ui.dataexport

import com.homeservices.customer.data.dataexport.DataExportRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.io.ByteArrayOutputStream
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
public class DataExportViewModelTest {
    private val repository: DataExportRepository = mockk()
    private val dispatcher = StandardTestDispatcher()
    private lateinit var viewModel: DataExportViewModel

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
        viewModel = DataExportViewModel(repository)
        // Override ioDispatcher so withContext(ioDispatcher) in saveToUri is driven
        // by the test scheduler (advanceUntilIdle() waits for it correctly).
        viewModel.ioDispatcher = dispatcher
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial state is Idle`() {
        assertThat(viewModel.uiState.value).isInstanceOf(DataExportUiState.Idle::class.java)
    }

    @Test
    public fun `requestExport transitions Idle to Loading then to Ready on success`(): Unit =
        runTest {
            val bytes = """{"profile":{"uid":"u-1"}}""".toByteArray()
            coEvery { repository.fetchExport() } returns flowOf(Result.success(bytes))

            viewModel.requestExport()
            // After launch but before coroutine runs, state is Loading
            assertThat(viewModel.uiState.value).isInstanceOf(DataExportUiState.Loading::class.java)

            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(DataExportUiState.Ready::class.java)
            assertThat((state as DataExportUiState.Ready).jsonBytes).isEqualTo(bytes)
        }

    @Test
    public fun `requestExport transitions to Error when repository returns failure`(): Unit =
        runTest {
            coEvery { repository.fetchExport() } returns
                flowOf(Result.failure(RuntimeException("network error")))

            viewModel.requestExport()
            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(DataExportUiState.Error::class.java)
            assertThat((state as DataExportUiState.Error).message).isNotBlank
        }

    @Test
    public fun `requestExport transitions to Error when repository throws`(): Unit =
        runTest {
            coEvery { repository.fetchExport() } throws RuntimeException("unexpected exception")

            viewModel.requestExport()
            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(DataExportUiState.Error::class.java)
        }

    @Test
    public fun `onRetry resets state to Idle from Error`(): Unit =
        runTest {
            coEvery { repository.fetchExport() } returns
                flowOf(Result.failure(RuntimeException("network error")))
            viewModel.requestExport()
            dispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isInstanceOf(DataExportUiState.Error::class.java)

            viewModel.onRetry()

            assertThat(viewModel.uiState.value).isInstanceOf(DataExportUiState.Idle::class.java)
        }

    @Test
    public fun `onSaved resets state to Idle from Ready`(): Unit =
        runTest {
            val bytes = """{"profile":{"uid":"u-1"}}""".toByteArray()
            coEvery { repository.fetchExport() } returns flowOf(Result.success(bytes))
            viewModel.requestExport()
            dispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isInstanceOf(DataExportUiState.Ready::class.java)

            viewModel.onSaved()

            assertThat(viewModel.uiState.value).isInstanceOf(DataExportUiState.Idle::class.java)
        }

    @Test
    public fun `onSaveCancelled transitions to Idle so user can retry`(): Unit =
        runTest {
            val bytes = """{"profile":{"uid":"u-1"}}""".toByteArray()
            coEvery { repository.fetchExport() } returns flowOf(Result.success(bytes))
            viewModel.requestExport()
            dispatcher.scheduler.advanceUntilIdle()
            // SAF picker opened (Ready); user presses back in the picker
            assertThat(viewModel.uiState.value).isInstanceOf(DataExportUiState.Ready::class.java)

            viewModel.onSaveCancelled()

            // Must return to Idle (not stay as Ready/Loading) so the Download button is visible
            assertThat(viewModel.uiState.value).isInstanceOf(DataExportUiState.Idle::class.java)
        }

    @Test
    public fun `saveToUri transitions to Saved on successful write`(): Unit =
        runTest {
            val bytes = """{"profile":{"uid":"u-1"}}""".toByteArray()
            val uriString = "content://media/external/downloads/data.json"
            val outputStream = ByteArrayOutputStream()

            // Internal overload: avoids Android framework classes (Uri, ContentResolver)
            // which are unavailable in JVM unit tests.
            viewModel.saveToUri(uriString, bytes) { outputStream }
            dispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(DataExportUiState.Saved::class.java)
            assertThat((viewModel.uiState.value as DataExportUiState.Saved).filePath)
                .isEqualTo(uriString)
        }

    @Test
    public fun `saveToUri transitions to Error when output stream is null`(): Unit =
        runTest {
            val bytes = """{"profile":{"uid":"u-1"}}""".toByteArray()
            val uriString = "content://media/external/downloads/data.json"

            // opener returns null — simulates a revoked storage provider
            viewModel.saveToUri(uriString, bytes) { null }
            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(DataExportUiState.Error::class.java)
            assertThat((state as DataExportUiState.Error).message).isNotBlank
        }

    @Test
    public fun `saveToUri transitions to Error when write throws IOException`(): Unit =
        runTest {
            val bytes = """{"profile":{"uid":"u-1"}}""".toByteArray()
            val uriString = "content://media/external/downloads/data.json"

            // opener throws — simulates "no space left on device"
            viewModel.saveToUri(uriString, bytes) { throw IOException("No space left on device") }
            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(DataExportUiState.Error::class.java)
            assertThat((state as DataExportUiState.Error).message).contains("No space")
        }
}
