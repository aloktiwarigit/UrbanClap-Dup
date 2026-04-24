package com.homeservices.technician.domain.photo

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class UploadJobPhotoUseCaseTest {
    private val repository: JobPhotoRepository = mockk()
    private val useCase = UploadJobPhotoUseCase(repository)

    private val storagePath = "bookings/b1/photos/uid123/REACHED/1234567890.jpg"

    @Test
    public fun `execute uploads then records storage path on success`(): Unit =
        runTest {
            coEvery { repository.uploadPhoto("b1", "REACHED", "/cache/photo.jpg") } returns
                Result.success(storagePath)
            coEvery { repository.recordPhotoPath("b1", "REACHED", storagePath) } returns
                Result.success(Unit)

            val result = useCase.execute("b1", "REACHED", "/cache/photo.jpg")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow()).isEqualTo(storagePath)
            coVerify(exactly = 1) { repository.recordPhotoPath("b1", "REACHED", storagePath) }
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
    public fun `execute returns failure when recordPhotoPath fails`(): Unit =
        runTest {
            val recordError = RuntimeException("API 500")
            coEvery { repository.uploadPhoto(any(), any(), any()) } returns Result.success(storagePath)
            coEvery { repository.recordPhotoPath(any(), any(), any()) } returns
                Result.failure(recordError)

            val result = useCase.execute("b1", "REACHED", "/cache/photo.jpg")

            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isEqualTo(recordError)
        }
}
