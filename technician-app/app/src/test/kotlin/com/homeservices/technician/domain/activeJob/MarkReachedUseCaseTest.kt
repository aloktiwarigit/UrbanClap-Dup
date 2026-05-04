package com.homeservices.technician.domain.activeJob

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GetTokenResult
import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.data.integrity.IntegrityNonceResponseDto
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import com.homeservices.technician.domain.integrity.IntegrityAttestor
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class MarkReachedUseCaseTest {
    private val repository: ActiveJobRepository = mockk()
    private val integrityAttestor: IntegrityAttestor = mockk()
    private val integrityApiService: IntegrityApiService = mockk()
    private val firebaseAuth: FirebaseAuth = mockk()
    private val firebaseUser: FirebaseUser = mockk()
    private val tokenResult: GetTokenResult = mockk()
    private val useCase = MarkReachedUseCase(repository, integrityAttestor, integrityApiService, firebaseAuth)

    @BeforeEach
    public fun setUp() {
        every { firebaseAuth.currentUser } returns firebaseUser
        every { firebaseUser.getIdToken(false) } returns Tasks.forResult(tokenResult)
        every { tokenResult.token } returns "firebase-token"
        coEvery { integrityApiService.getNonce(any()) } returns IntegrityNonceResponseDto("test-nonce")
        coEvery { integrityAttestor.attest("test-nonce") } returns Result.success("integrity-token")
    }

    private fun aJob() =
        ActiveJob(
            bookingId = "bk-1",
            customerId = "c-1",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "12 Main St",
            addressLatLng = LatLng(12.9, 77.6),
            status = ActiveJobStatus.REACHED,
            slotDate = "2026-05-01",
            slotWindow = "10:00-12:00",
        )

    @Test
    public fun `transitions EN_ROUTE to REACHED with integrity token`(): Unit =
        runTest {
            coEvery {
                repository.transitionStatus("bk-1", ActiveJobStatus.REACHED, "integrity-token")
            } returns Result.success(aJob())

            val result = useCase("bk-1")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().status).isEqualTo(ActiveJobStatus.REACHED)
            coVerify(exactly = 1) {
                repository.transitionStatus("bk-1", ActiveJobStatus.REACHED, "integrity-token")
            }
        }

    @Test
    public fun `proceeds with null token when attestation fails (fail-open)`(): Unit =
        runTest {
            coEvery { integrityAttestor.attest(any()) } returns Result.failure(RuntimeException("attestation failed"))
            coEvery {
                repository.transitionStatus("bk-1", ActiveJobStatus.REACHED, null)
            } returns Result.success(aJob())

            val result = useCase("bk-1")

            assertThat(result.isSuccess).isTrue()
            coVerify(exactly = 1) {
                repository.transitionStatus("bk-1", ActiveJobStatus.REACHED, null)
            }
        }
}
