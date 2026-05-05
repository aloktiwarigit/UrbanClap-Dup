package com.homeservices.technician.domain.kyc

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GetTokenResult
import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.data.integrity.IntegrityNonceResponseDto
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.domain.integrity.IntegrityAttestor
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import io.mockk.coEvery
import io.mockk.every
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
    private lateinit var integrityAttestor: IntegrityAttestor
    private lateinit var integrityApiService: IntegrityApiService
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var firebaseUser: FirebaseUser
    private lateinit var tokenResult: GetTokenResult
    private lateinit var useCase: DigiLockerConsentUseCase

    @BeforeEach
    public fun setUp(): Unit {
        repo = mockk()
        integrityAttestor = mockk()
        integrityApiService = mockk()
        firebaseAuth = mockk()
        firebaseUser = mockk()
        tokenResult = mockk()
        every { firebaseAuth.currentUser } returns firebaseUser
        every { firebaseUser.getIdToken(false) } returns Tasks.forResult(tokenResult)
        every { tokenResult.token } returns "firebase-token"
        coEvery { integrityApiService.getNonce(any()) } returns IntegrityNonceResponseDto("nonce-kyc")
        coEvery { integrityAttestor.attest("nonce-kyc") } returns Result.success("integrity-token-kyc")
        useCase = DigiLockerConsentUseCase(repo, integrityAttestor, integrityApiService, firebaseAuth)
    }

    @Test
    public fun `emits AadhaarVerified when API returns verified`(): Unit =
        runTest {
            coEvery {
                repo.exchangeAadhaarCode("code123", "homeservices://digilocker", "integrity-token-kyc")
            } returns DigiLockerResult.AadhaarVerified("XXXX-XXXX-1234")

            val results = useCase("code123", "homeservices://digilocker").toList()

            assertThat(results).hasSize(1)
            assertThat(results[0]).isInstanceOf(DigiLockerResult.AadhaarVerified::class.java)
            assertThat((results[0] as DigiLockerResult.AadhaarVerified).maskedNumber)
                .isEqualTo("XXXX-XXXX-1234")
        }

    @Test
    public fun `emits UserCancelled when repo returns UserCancelled`(): Unit =
        runTest {
            coEvery { repo.exchangeAadhaarCode(any(), any(), any()) } returns DigiLockerResult.UserCancelled

            val results = useCase("", "homeservices://digilocker").toList()

            assertThat(results).hasSize(1)
            assertThat(results[0]).isInstanceOf(DigiLockerResult.UserCancelled::class.java)
        }

    @Test
    public fun `emits NetworkError when repo returns NetworkError`(): Unit =
        runTest {
            val ex = RuntimeException("No internet")
            coEvery { repo.exchangeAadhaarCode(any(), any(), any()) } returns DigiLockerResult.NetworkError(ex)

            val results = useCase("code", "homeservices://digilocker").toList()

            assertThat(results).hasSize(1)
            val err = results[0] as DigiLockerResult.NetworkError
            assertThat(err.cause).isEqualTo(ex)
        }

    @Test
    public fun `emits ApiError when repo returns ApiError`(): Unit =
        runTest {
            coEvery { repo.exchangeAadhaarCode(any(), any(), any()) } returns
                DigiLockerResult.ApiError("Unexpected response: verified=false")

            val results = useCase("code", "homeservices://digilocker").toList()

            assertThat(results).hasSize(1)
            assertThat(results[0]).isInstanceOf(DigiLockerResult.ApiError::class.java)
        }

    @Test
    public fun `proceeds with null token when attestation fails (fail-open)`(): Unit =
        runTest {
            coEvery { integrityAttestor.attest(any()) } returns Result.failure(RuntimeException("Play Integrity unavailable"))
            coEvery { repo.exchangeAadhaarCode(any(), any(), null) } returns
                DigiLockerResult.AadhaarVerified("XXXX-XXXX-5678")

            val results = useCase("code", "homeservices://digilocker").toList()

            assertThat(results).hasSize(1)
            assertThat(results[0]).isInstanceOf(DigiLockerResult.AadhaarVerified::class.java)
        }
}
