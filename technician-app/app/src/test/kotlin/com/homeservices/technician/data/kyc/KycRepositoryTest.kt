package com.homeservices.technician.data.kyc

import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class KycRepositoryTest {
    private lateinit var api: KycApiService
    private lateinit var repo: KycRepositoryImpl

    @BeforeEach
    public fun setUp(): Unit {
        api = mockk()
        repo = KycRepositoryImpl(api)
    }

    @Test
    public fun `exchangeAadhaarCode returns AadhaarVerified on success`(): Unit =
        runTest {
            coEvery { api.submitAadhaar(AadhaarRequest("code", "uri")) } returns
                AadhaarResponse("AADHAAR_DONE", "XXXX-XXXX-1234", true)

            val result = repo.exchangeAadhaarCode("code", "uri")

            assertThat(result).isInstanceOf(DigiLockerResult.AadhaarVerified::class.java)
            assertThat((result as DigiLockerResult.AadhaarVerified).maskedNumber).isEqualTo("XXXX-XXXX-1234")
        }

    @Test
    public fun `exchangeAadhaarCode returns NetworkError on exception`(): Unit =
        runTest {
            coEvery { api.submitAadhaar(any()) } throws RuntimeException("timeout")

            val result = repo.exchangeAadhaarCode("code", "uri")

            assertThat(result).isInstanceOf(DigiLockerResult.NetworkError::class.java)
        }

    @Test
    public fun `submitPanOcr returns ManualReview when status is MANUAL_REVIEW`(): Unit =
        runTest {
            coEvery { api.submitPanOcr(PanOcrRequest("path/pan.jpg")) } returns
                PanOcrResponse("MANUAL_REVIEW", null)

            val result = repo.submitPanOcr("path/pan.jpg")

            assertThat(result).isInstanceOf(PanOcrResult.ManualReview::class.java)
        }

    @Test
    public fun `submitPanOcr returns Success with panNumber`(): Unit =
        runTest {
            coEvery { api.submitPanOcr(PanOcrRequest("path/pan.jpg")) } returns
                PanOcrResponse("PAN_DONE", "ABCDE1234F")

            val result = repo.submitPanOcr("path/pan.jpg")

            val success = result as PanOcrResult.Success
            assertThat(success.panNumber).isEqualTo("ABCDE1234F")
        }
}
