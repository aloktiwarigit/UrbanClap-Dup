package com.homeservices.customer.domain.auth

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import com.homeservices.customer.domain.flags.FeatureFlags
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.unmockkAll
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * SEC-02 verification gate.
 *
 * Locks down the contract that [AuthOrchestrator.completeWithTruecaller] routes
 * through [VerifyTruecallerUseCase] (server-side RSA signature verification)
 * when the `truecaller_server_verify_v2` feature flag is ON, and falls back to
 * [SaveSessionUseCase.saveAnonymousWithPhone] when the flag is OFF.
 *
 * Operational follow-up (NOT this PR):
 *  - Set `GROWTHBOOK_CLIENT_KEY` env var in `customer-ship.yml` release env.
 *  - Configure `truecaller_server_verify_v2` flag in GrowthBook dashboard to
 *    ON for 100% rollout.
 *  - Soak 7 days.
 *  - Author follow-up PR (E11-S01b) to delete the `saveAnonymousWithPhone`
 *    fallback path entirely.
 *
 * This is intentionally a separate test class from [AuthOrchestratorTest] so
 * the SEC-02 verification gate is discoverable in isolation (named after the
 * flag) and a future refactor cannot silently break the routing contract
 * without a CI failure that names the security gate it broke.
 */
public class AuthOrchestratorFlagOnTest {
    private val truecallerUseCase: TruecallerLoginUseCase = mockk(relaxed = true)
    private val firebaseOtpUseCase: FirebaseOtpUseCase = mockk(relaxed = true)
    private val saveSessionUseCase: SaveSessionUseCase = mockk(relaxed = true)
    private val googleSignInUseCase: GoogleSignInUseCase = mockk(relaxed = true)
    private val emailPasswordUseCase: EmailPasswordUseCase = mockk(relaxed = true)
    private val firebaseAuth: FirebaseAuth = mockk(relaxed = true)
    private val verifyTruecallerUseCase: VerifyTruecallerUseCase = mockk()
    private val featureFlags: FeatureFlags = mockk()
    private lateinit var orchestrator: AuthOrchestrator

    @BeforeEach
    public fun setUp() {
        orchestrator =
            AuthOrchestrator(
                truecallerUseCase = truecallerUseCase,
                firebaseOtpUseCase = firebaseOtpUseCase,
                saveSessionUseCase = saveSessionUseCase,
                googleSignInUseCase = googleSignInUseCase,
                emailPasswordUseCase = emailPasswordUseCase,
                firebaseAuth = firebaseAuth,
                verifyTruecallerUseCase = verifyTruecallerUseCase,
                featureFlags = featureFlags,
            )
    }

    @AfterEach
    public fun tearDown() {
        unmockkAll()
    }

    @Test
    public fun `completeWithTruecaller routes through VerifyTruecallerUseCase when truecallerServerVerify flag is ON`(): Unit =
        runTest {
            val verifiedUser = mockk<FirebaseUser> { every { uid } returns "verified-uid" }
            every { featureFlags.truecallerServerVerify() } returns true
            coEvery {
                verifyTruecallerUseCase.invoke(
                    payload = "payload-b64",
                    signature = "sig-b64",
                    signatureAlgorithm = "SHA512withRSA",
                )
            } returns Result.success(verifiedUser)
            coEvery { saveSessionUseCase.save(verifiedUser, "5678") } returns Unit

            val success =
                TruecallerAuthResult.Success(
                    payload = "payload-b64",
                    signature = "sig-b64",
                    signatureAlgorithm = "SHA512withRSA",
                    phoneLastFour = "5678",
                )
            val result = orchestrator.completeWithTruecaller(success)

            // Outcome: server-verified session, NOT an anonymous one.
            assertThat(result).isInstanceOf(AuthResult.Success::class.java)
            coVerify(exactly = 1) {
                verifyTruecallerUseCase.invoke(
                    payload = "payload-b64",
                    signature = "sig-b64",
                    signatureAlgorithm = "SHA512withRSA",
                )
            }
            coVerify(exactly = 1) { saveSessionUseCase.save(verifiedUser, "5678") }
            // Anonymous fallback MUST NOT be invoked when the flag is ON.
            coVerify(exactly = 0) { saveSessionUseCase.saveAnonymousWithPhone(any()) }
        }

    @Test
    public fun `completeWithTruecaller falls back to anonymous sign-in when truecallerServerVerify flag is OFF`(): Unit =
        runTest {
            val anonymousUser = mockk<FirebaseUser>()
            every { featureFlags.truecallerServerVerify() } returns false
            coEvery { saveSessionUseCase.saveAnonymousWithPhone("1234") } returns AuthResult.Success(anonymousUser)

            val success =
                TruecallerAuthResult.Success(
                    payload = "payload-b64",
                    signature = "sig-b64",
                    signatureAlgorithm = "SHA512withRSA",
                    phoneLastFour = "1234",
                )
            val result = orchestrator.completeWithTruecaller(success)

            // Outcome: anonymous session, NOT a server-verified one.
            assertThat(result).isInstanceOf(AuthResult.Success::class.java)
            coVerify(exactly = 1) { saveSessionUseCase.saveAnonymousWithPhone("1234") }
            // Server-verify path MUST NOT be invoked when the flag is OFF.
            coVerify(exactly = 0) {
                verifyTruecallerUseCase.invoke(
                    payload = any(),
                    signature = any(),
                    signatureAlgorithm = any(),
                )
            }
            coVerify(exactly = 0) { saveSessionUseCase.save(any(), any()) }
        }
}
