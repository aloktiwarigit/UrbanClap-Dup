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

    private val remoteUrl = "https://storage.googleapis.com/bucket/bookings/b1/photos/REACHED/ts.jpg"

    @Test
    public fun `execute uploads then records URL on success`() = runTest {
        coEvery { repository.uploadPhoto("b1", "REACHED", "/cache/photo.jpg") } returns
            Result.success(remoteUrl)
        coEvery { repository.recordPhotoUrl("b1", "REACHED", remoteUrl) } returns
            Result.success(Unit)

        val result = useCase.execute("b1", "REACHED", "/cache/photo.jpg")

        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrThrow()).isEqualTo(remoteUrl)
        coVerify(exactly = 1) { repository.recordPhotoUrl("b1", "REACHED", remoteUrl) }
    }

    @Test
    public fun `execute returns failure and skips recordPhotoUrl if upload fails`() = runTest {
        val error = RuntimeException("Storage quota exceeded")
        coEvery { repository.uploadPhoto(any(), any(), any()) } returns Result.failure(error)

        val result = useCase.execute("b1", "REACHED", "/cache/photo.jpg")

        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()).isEqualTo(error)
        coVerify(exactly = 0) { repository.recordPhotoUrl(any(), any(), any()) }
    }

    @Test
    public fun `execute returns failure when recordPhotoUrl fails`() = runTest {
        val recordError = RuntimeException("API 500")
        coEvery { repository.uploadPhoto(any(), any(), any()) } returns Result.success(remoteUrl)
        coEvery { repository.recordPhotoUrl(any(), any(), any()) } returns
            Result.failure(recordError)

        val result = useCase.execute("b1", "REACHED", "/cache/photo.jpg")

        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()).isEqualTo(recordError)
    }
}
