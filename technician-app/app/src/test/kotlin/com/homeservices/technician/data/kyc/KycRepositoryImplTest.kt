package com.homeservices.technician.data.kyc

import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.PanOcrResult

public class KycRepositoryImplTest {

    private val api: KycApiService = mockk()
    private val sut = KycRepositoryImpl(api)

    @Test
    public fun `exchangeAadhaarCode returns AadhaarVerified on success`(): Unit = runTest {
        coEvery { api.submitAadhaar(any()) } returns AadhaarResponse(
            kycStatus = "AADHAAR_DONE", aadhaarMaskedNumber = "XXXX-XXXX-1234", aadhaarVerified = true
        )
        val result = sut.exchangeAadhaarCode("code", "https://redirect")
        assertThat(result).isInstanceOf(DigiLockerResult.AadhaarVerified::class.java)
        assertThat((result as DigiLockerResult.AadhaarVerified).maskedNumber).isEqualTo("XXXX-XXXX-1234")
    }

    @Test
    public fun `exchangeAadhaarCode returns NetworkError on exception`(): Unit = runTest {
        coEvery { api.submitAadhaar(any()) } throws RuntimeException("network")
        val result = sut.exchangeAadhaarCode("code", "https://redirect")
        assertThat(result).isInstanceOf(DigiLockerResult.NetworkError::class.java)
    }

    @Test
    public fun `exchangeAadhaarCode returns ApiError when aadhaarVerified is false`(): Unit = runTest {
        coEvery { api.submitAadhaar(any()) } returns AadhaarResponse(
            kycStatus = "PENDING", aadhaarMaskedNumber = null, aadhaarVerified = false
        )
        val result = sut.exchangeAadhaarCode("code", "https://redirect")
        assertThat(result).isInstanceOf(DigiLockerResult.ApiError::class.java)
    }

    @Test
    public fun `submitPanOcr returns ManualReview when API returns MANUAL_REVIEW`(): Unit = runTest {
        coEvery { api.submitPanOcr(any()) } returns PanOcrResponse(kycStatus = "MANUAL_REVIEW", panNumber = null)
        val result = sut.submitPanOcr("technicians/t1/pan.jpg")
        assertThat(result).isEqualTo(PanOcrResult.ManualReview)
    }

    @Test
    public fun `submitPanOcr returns Success with panNumber`(): Unit = runTest {
        coEvery { api.submitPanOcr(any()) } returns PanOcrResponse(kycStatus = "PAN_DONE", panNumber = "ABCDE1234F")
        val result = sut.submitPanOcr("technicians/t1/pan.jpg")
        assertThat(result).isInstanceOf(PanOcrResult.Success::class.java)
        assertThat((result as PanOcrResult.Success).panNumber).isEqualTo("ABCDE1234F")
    }

    @Test
    public fun `submitPanOcr returns UploadError on exception`(): Unit = runTest {
        coEvery { api.submitPanOcr(any()) } throws RuntimeException("upload failed")
        val result = sut.submitPanOcr("technicians/t1/pan.jpg")
        assertThat(result).isInstanceOf(PanOcrResult.UploadError::class.java)
    }

    @Test
    public fun `submitPanOcr returns OcrError when panNumber is null but status not MANUAL_REVIEW`(): Unit = runTest {
        coEvery { api.submitPanOcr(any()) } returns PanOcrResponse(kycStatus = "PAN_DONE", panNumber = null)
        val result = sut.submitPanOcr("technicians/t1/pan.jpg")
        assertThat(result).isInstanceOf(PanOcrResult.OcrError::class.java)
    }

    @Test
    public fun `getKycStatus maps response to KycState`(): Unit = runTest {
        coEvery { api.getKycStatus() } returns KycStatusResponse(
            technicianId = "tech_1",
            kycStatus = "COMPLETE",
            aadhaarVerified = true,
            aadhaarMaskedNumber = "XXXX-XXXX-1234",
            panNumber = "ABCDE1234F",
        )
        val state = sut.getKycStatus()
        assertThat(state.aadhaarVerified).isTrue()
        assertThat(state.panNumber).isEqualTo("ABCDE1234F")
    }
}
