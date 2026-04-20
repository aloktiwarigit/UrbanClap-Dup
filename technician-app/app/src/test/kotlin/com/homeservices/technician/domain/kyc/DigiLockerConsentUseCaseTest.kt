package com.homeservices.technician.domain.kyc

import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@ExperimentalCoroutinesApi
public class DigiLockerConsentUseCaseTest {

    private lateinit var repo: KycRepository
    private lateinit var useCase: DigiLockerConsentUseCase

    @BeforeEach
    public fun setUp(): Unit {
        repo = mockk()
        useCase = DigiLockerConsentUseCase(repo)
    }

    @Test
    public fun `emits AadhaarVerified when API returns verified`(): Unit = runTest {
        coEvery { repo.exchangeAadhaarCode("code123", "homeservices://digilocker") } returns
            DigiLockerResult.AadhaarVerified("XXXX-XXXX-1234")

        val results = useCase("code123", "homeservices://digilocker").toList()

        assertThat(results).hasSize(1)
        assertThat(results[0]).isInstanceOf(DigiLockerResult.AadhaarVerified::class.java)
        assertThat((results[0] as DigiLockerResult.AadhaarVerified).maskedNumber)
            .isEqualTo("XXXX-XXXX-1234")
    }

    @Test
    public fun `emits UserCancelled when repo returns UserCancelled`(): Unit = runTest {
        coEvery { repo.exchangeAadhaarCode(any(), any()) } returns DigiLockerResult.UserCancelled

        val results = useCase("", "homeservices://digilocker").toList()

        assertThat(results).hasSize(1)
        assertThat(results[0]).isInstanceOf(DigiLockerResult.UserCancelled::class.java)
    }

    @Test
    public fun `emits NetworkError when repo returns NetworkError`(): Unit = runTest {
        val ex = RuntimeException("No internet")
        coEvery { repo.exchangeAadhaarCode(any(), any()) } returns DigiLockerResult.NetworkError(ex)

        val results = useCase("code", "homeservices://digilocker").toList()

        assertThat(results).hasSize(1)
        val err = results[0] as DigiLockerResult.NetworkError
        assertThat(err.cause).isEqualTo(ex)
    }

    @Test
    public fun `emits ApiError when repo returns ApiError`(): Unit = runTest {
        coEvery { repo.exchangeAadhaarCode(any(), any()) } returns
            DigiLockerResult.ApiError("Unexpected response: verified=false")

        val results = useCase("code", "homeservices://digilocker").toList()

        assertThat(results).hasSize(1)
        assertThat(results[0]).isInstanceOf(DigiLockerResult.ApiError::class.java)
    }
}
