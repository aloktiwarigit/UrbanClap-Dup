package com.homeservices.technician.domain.kyc

import android.net.Uri
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class PanOcrUseCaseTest {

    private lateinit var repo: KycRepository
    private lateinit var firebaseStorageUploader: FirebaseStorageUploader
    private lateinit var useCase: PanOcrUseCase

    @BeforeEach
    public fun setUp(): Unit {
        repo = mockk()
        firebaseStorageUploader = mockk()
        useCase = PanOcrUseCase(repo, firebaseStorageUploader)
    }

    @Test
    public fun `emits Success with panNumber when OCR succeeds`(): Unit = runTest {
        val imageUri = mockk<Uri>()
        coEvery { firebaseStorageUploader.upload(imageUri, any()) } returns "technicians/t1/pan.jpg"
        coEvery { repo.submitPanOcr("technicians/t1/pan.jpg") } returns PanOcrResult.Success("ABCDE1234F")

        val results = useCase(imageUri, technicianId = "t1").toList()

        assertThat(results).hasSize(1)
        assertThat(results[0]).isInstanceOf(PanOcrResult.Success::class.java)
        assertThat((results[0] as PanOcrResult.Success).panNumber).isEqualTo("ABCDE1234F")
    }

    @Test
    public fun `emits ManualReview when API returns ManualReview`(): Unit = runTest {
        val imageUri = mockk<Uri>()
        coEvery { firebaseStorageUploader.upload(imageUri, any()) } returns "technicians/t1/pan.jpg"
        coEvery { repo.submitPanOcr(any()) } returns PanOcrResult.ManualReview

        val results = useCase(imageUri, "t1").toList()

        assertThat(results.first()).isInstanceOf(PanOcrResult.ManualReview::class.java)
    }

    @Test
    public fun `emits UploadError when Firebase Storage upload throws`(): Unit = runTest {
        val imageUri = mockk<Uri>()
        val ex = RuntimeException("Storage quota exceeded")
        coEvery { firebaseStorageUploader.upload(imageUri, any()) } throws ex

        val results = useCase(imageUri, "t1").toList()

        val uploadErr = results.first() as PanOcrResult.UploadError
        assertThat(uploadErr.cause).isEqualTo(ex)
    }
}
