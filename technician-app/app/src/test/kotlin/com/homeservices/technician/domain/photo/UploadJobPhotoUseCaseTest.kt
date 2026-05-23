package com.homeservices.technician.domain.photo

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class UploadJobPhotoUseCaseTest {
    private val repository: JobPhotoRepository = mockk()
    private val useCase = UploadJobPhotoUseCase(repository)

    private val storagePath = "bookings/b1/photos/uid123/REACHED/1234567890.jpg"

    @Test
    public fun `execute uploads then records storage path on success — local file is deleted`(): Unit =
        runTest {
            coEvery { repository.uploadPhoto("b1", "REACHED", "/cache/photo.jpg") } returns
                Result.success(storagePath)
            coEvery { repository.recordPhotoPath("b1", "REACHED", storagePath) } returns
                Result.success(Unit)
            every { repository.deleteLocalPhoto(any()) } returns Unit

            val result = useCase.execute("b1", "REACHED", "/cache/photo.jpg")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow()).isEqualTo(storagePath)
            coVerify(exactly = 1) { repository.recordPhotoPath("b1", "REACHED", storagePath) }
            // Full end-to-end success → local file must be deleted to free filesDir.
            verify(exactly = 1) { repository.deleteLocalPhoto("/cache/photo.jpg") }
        }

    @Test
    public fun `execute returns failure and skips recordPhotoPath if upload fails`(): Unit =
        runTest {
            val error = RuntimeException("Storage quota exceeded")
            coEvery { repository.uploadPhoto(any(), any(), any()) } returns Result.failure(error)

            val result = useCase.execute("b1", "REACHED", "/cache/photo.jpg")

            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isEqualTo(error)
            coVerify(exactly = 0) { repository.recordPhotoPath(any(), any(), any()) }
        }

    @Test
    public fun `execute returns failure when recordPhotoPath fails — local file is NOT deleted to allow retry`(): Unit =
        runTest {
            val recordError = RuntimeException("API 500")
            coEvery { repository.uploadPhoto(any(), any(), any()) } returns Result.success(storagePath)
            coEvery { repository.recordPhotoPath(any(), any(), any()) } returns
                Result.failure(recordError)

            val result = useCase.execute("b1", "REACHED", "/cache/photo.jpg")

            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isEqualTo(recordError)
            // Retry-path invariant (per Codex review on 5ca3e329): a record-step failure
            // after a successful Storage upload must NOT delete the local file, otherwise
            // the UI's retry-with-same-localFilePath would fail at decode instead of
            // recovering from the transient API failure.
            verify(exactly = 0) { repository.deleteLocalPhoto(any()) }
        }
}
