package com.homeservices.technician.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.technician.domain.auth.model.AuthResult
import com.homeservices.technician.domain.auth.model.GoogleSignInResult
import com.homeservices.technician.domain.auth.model.OtpSendResult
import com.homeservices.technician.domain.auth.model.TruecallerAuthResult
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class AuthOrchestratorTest {
    private lateinit var truecallerUseCase: TruecallerLoginUseCase
    private lateinit var firebaseOtpUseCase: FirebaseOtpUseCase
    private lateinit var saveSessionUseCase: SaveSessionUseCase
    private val googleSignInUseCase: GoogleSignInUseCase = mockk()
    private val emailPasswordUseCase: EmailPasswordUseCase = mockk()
    private val firebaseAuth: FirebaseAuth = mockk()
    private lateinit var orchestrator: AuthOrchestrator

    @BeforeEach
    public fun setUp() {
        truecallerUseCase = mockk(relaxed = true)
        firebaseOtpUseCase = mockk(relaxed = true)
        saveSessionUseCase = mockk(relaxed = true)
        orchestrator =
            AuthOrchestrator(
                truecallerUseCase = truecallerUseCase,
                firebaseOtpUseCase = firebaseOtpUseCase,
                saveSessionUseCase = saveSessionUseCase,
                googleSignInUseCase = googleSignInUseCase,
                emailPasswordUseCase = emailPasswordUseCase,
                firebaseAuth = firebaseAuth,
            )
    }

    @Test
    public fun `start returns TruecallerLaunched and calls launch when Truecaller is available`() {
        val context = mockk<Context>()
        val activity = mockk<FragmentActivity>()
        every { truecallerUseCase.isAvailable() } returns true

        val result = orchestrator.start(context, activity)

        assertThat(result).isEqualTo(AuthOrchestrator.StartResult.TruecallerLaunched)
        verify { truecallerUseCase.init(context) }
        verify { truecallerUseCase.launch(activity) }
    }

    @Test
    public fun `start returns FallbackToOtp when Truecaller is unavailable`() {
        val context = mockk<Context>()
        val activity = mockk<FragmentActivity>()
        every { truecallerUseCase.isAvailable() } returns false

        val result = orchestrator.start(context, activity)

        assertThat(result).isEqualTo(AuthOrchestrator.StartResult.FallbackToOtp)
        verify(exactly = 0) { truecallerUseCase.launch(any()) }
    }

    @Test
    public fun `observeTruecallerResults returns flow from TruecallerLoginUseCase`() {
        val sharedFlow = MutableSharedFlow<TruecallerAuthResult>()
        every { truecallerUseCase.resultFlow } returns sharedFlow

        val result = orchestrator.observeTruecallerResults()

        assertThat(result).isSameAs(sharedFlow)
    }

    @Test
    public fun `sendOtp delegates to FirebaseOtpUseCase`() {
        val activity = mockk<FragmentActivity>()
        val token = mockk<PhoneAuthProvider.ForceResendingToken>()
        val expectedFlow = flowOf(OtpSendResult.CodeSent("vid", token))
        every { firebaseOtpUseCase.sendOtp("+91123", activity, token) } returns expectedFlow

        val result = orchestrator.sendOtp("+91123", activity, token)

        assertThat(result).isSameAs(expectedFlow)
    }

    @Test
    public fun `verifyOtp delegates to FirebaseOtpUseCase`() {
        val expectedFlow = flowOf(AuthResult.Error.WrongCode)
        every { firebaseOtpUseCase.verifyOtp("vid", "123456") } returns expectedFlow

        val result = orchestrator.verifyOtp("vid", "123456")

        assertThat(result).isSameAs(expectedFlow)
    }

    @Test
    public fun `signInWithCredential delegates to FirebaseOtpUseCase`() {
        val credential = mockk<PhoneAuthCredential>()
        val user = mockk<FirebaseUser>()
        val expectedFlow = flowOf(AuthResult.Success(user))
        every { firebaseOtpUseCase.signInWithCredential(credential) } returns expectedFlow

        val result = orchestrator.signInWithCredential(credential)

        assertThat(result).isSameAs(expectedFlow)
    }

    @Test
    public fun `completeWithTruecaller delegates to SaveSessionUseCase`(): Unit =
        runTest {
            val user = mockk<FirebaseUser>()
            coEvery { saveSessionUseCase.saveAnonymousWithPhone("+91123") } returns AuthResult.Success(user)

            val result = orchestrator.completeWithTruecaller("+91123")

            assertThat(result).isInstanceOf(AuthResult.Success::class.java)
            coVerify { saveSessionUseCase.saveAnonymousWithPhone("+91123") }
        }

    @Test
    public fun `completeWithFirebase delegates to SaveSessionUseCase`(): Unit =
        runTest {
            val user = mockk<FirebaseUser> { every { uid } returns "uid-1" }
            coEvery { saveSessionUseCase.save(user, "6789") } returns Unit

            orchestrator.completeWithFirebase(user, "6789")

            coVerify { saveSessionUseCase.save(user, "6789") }
        }

    @Test
    public fun `startGoogleSignIn CredentialObtained no anonymous user signs in and saves Google session`(): Unit =
        runTest {
            val credential: AuthCredential = mockk()
            val user: FirebaseUser = mockk(relaxed = true)
            val firebaseResult: com.google.firebase.auth.AuthResult = mockk { every { this@mockk.user } returns user }
            val activity = mockk<FragmentActivity>()

            coEvery { googleSignInUseCase.getCredential(any()) } returns
                GoogleSignInResult.CredentialObtained(credential)
            every { firebaseAuth.currentUser } returns null
            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forResult(firebaseResult)
            coEvery { saveSessionUseCase.saveWithGoogle(user) } returns Unit

            val results = orchestrator.startGoogleSignIn(activity).toList()

            assertThat(results.single()).isInstanceOf(AuthResult.Success::class.java)
            coVerify { saveSessionUseCase.saveWithGoogle(user) }
        }

    @Test
    public fun `startGoogleSignIn collision falls back to signInWithCredential`(): Unit =
        runTest {
            val credential: AuthCredential = mockk()
            val user: FirebaseUser = mockk(relaxed = true)
            val firebaseResult: com.google.firebase.auth.AuthResult = mockk { every { this@mockk.user } returns user }
            val collision: FirebaseAuthUserCollisionException = mockk(relaxed = true)
            val anonymousUser: FirebaseUser =
                mockk {
                    every { isAnonymous } returns true
                    every { linkWithCredential(credential) } returns Tasks.forException(collision)
                }
            val activity = mockk<FragmentActivity>()

            coEvery { googleSignInUseCase.getCredential(any()) } returns
                GoogleSignInResult.CredentialObtained(credential)
            every { firebaseAuth.currentUser } returns anonymousUser
            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forResult(firebaseResult)
            coEvery { saveSessionUseCase.saveWithGoogle(user) } returns Unit

            val results = orchestrator.startGoogleSignIn(activity).toList()

            assertThat(results.single()).isInstanceOf(AuthResult.Success::class.java)
            verify { firebaseAuth.signInWithCredential(credential) }
        }

    @Test
    public fun `startEmailSignIn verified user saves email session`(): Unit =
        runTest {
            val user: FirebaseUser =
                mockk(relaxed = true) {
                    every { isEmailVerified } returns true
                }
            every { emailPasswordUseCase.signIn(any(), any()) } returns flowOf(AuthResult.Success(user))
            coEvery { saveSessionUseCase.saveWithEmail(user) } returns Unit

            val results = orchestrator.startEmailSignIn("tech@example.com", "pass123").toList()

            assertThat(results.single()).isInstanceOf(AuthResult.Success::class.java)
            coVerify { saveSessionUseCase.saveWithEmail(user) }
        }
}
