package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.GoogleSignInResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
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
    public fun `startGoogleSignIn — CredentialObtained no anonymous user — signInWithCredential and saveWithGoogle`(): Unit =
        runTest {
            val mockCredential: AuthCredential = mockk()
            val mockUser: FirebaseUser = mockk(relaxed = true)
            val mockFirebaseAuthResult: com.google.firebase.auth.AuthResult = mockk { every { user } returns mockUser }
            val activity = mockk<FragmentActivity>()

            coEvery { googleSignInUseCase.getCredential(any()) } returns GoogleSignInResult.CredentialObtained(mockCredential)
            every { firebaseAuth.currentUser } returns null
            every { firebaseAuth.signInWithCredential(mockCredential) } returns Tasks.forResult(mockFirebaseAuthResult)
            coEvery { saveSessionUseCase.saveWithGoogle(mockUser) } returns Unit

            val results = orchestrator.startGoogleSignIn(activity).toList()

            assertThat(results.single()).isInstanceOf(AuthResult.Success::class.java)
            coVerify { saveSessionUseCase.saveWithGoogle(mockUser) }
        }

    @Test
    public fun `startGoogleSignIn — CredentialObtained anonymous user — linkWithCredential called`(): Unit =
        runTest {
            val mockCredential: AuthCredential = mockk()
            val mockUser: FirebaseUser = mockk(relaxed = true)
            val mockFirebaseAuthResult: com.google.firebase.auth.AuthResult = mockk { every { user } returns mockUser }
            val mockAnonymousUser: FirebaseUser =
                mockk {
                    every { isAnonymous } returns true
                    every { linkWithCredential(mockCredential) } returns Tasks.forResult(mockFirebaseAuthResult)
                }
            val activity = mockk<FragmentActivity>()

            coEvery { googleSignInUseCase.getCredential(any()) } returns GoogleSignInResult.CredentialObtained(mockCredential)
            every { firebaseAuth.currentUser } returns mockAnonymousUser
            coEvery { saveSessionUseCase.saveWithGoogle(any()) } returns Unit

            val results = orchestrator.startGoogleSignIn(activity).toList()

            assertThat(results.single()).isInstanceOf(AuthResult.Success::class.java)
            verify { mockAnonymousUser.linkWithCredential(mockCredential) }
        }

    @Test
    public fun `startGoogleSignIn — Cancelled — emits AuthResult Cancelled`(): Unit =
        runTest {
            val activity = mockk<FragmentActivity>()
            coEvery { googleSignInUseCase.getCredential(any()) } returns GoogleSignInResult.Cancelled

            val results = orchestrator.startGoogleSignIn(activity).toList()

            assertThat(results.single()).isEqualTo(AuthResult.Cancelled)
        }

    @Test
    public fun `startEmailSignIn — success — saves session and emits Success`(): Unit =
        runTest {
            val mockUser: FirebaseUser = mockk(relaxed = true)
            every { emailPasswordUseCase.signIn(any(), any()) } returns
                flowOf(
                    AuthResult.Success(mockUser),
                )
            coEvery { saveSessionUseCase.saveWithEmail(mockUser) } returns Unit

            val results = orchestrator.startEmailSignIn("a@b.com", "pass1234").toList()

            assertThat(results.single()).isInstanceOf(AuthResult.Success::class.java)
            coVerify { saveSessionUseCase.saveWithEmail(mockUser) }
        }

    @Test
    public fun `startEmailSignUp — no anonymous user — delegates to emailPasswordUseCase signUp`(): Unit =
        runTest {
            val mockUser: FirebaseUser = mockk(relaxed = true)
            every { emailPasswordUseCase.signUp(any(), any()) } returns
                flowOf(
                    AuthResult.Success(mockUser),
                )
            every { firebaseAuth.currentUser } returns null
            coEvery { saveSessionUseCase.saveWithEmail(mockUser) } returns Unit

            val results = orchestrator.startEmailSignUp("a@b.com", "pass1234").toList()

            assertThat(results.single()).isInstanceOf(AuthResult.Success::class.java)
        }

    @Test
    public fun `sendPasswordReset — delegates to emailPasswordUseCase and returns result`(): Unit =
        runTest {
            every { emailPasswordUseCase.sendPasswordReset(any()) } returns flowOf(Result.success(Unit))

            val results = orchestrator.sendPasswordReset("a@b.com").toList()

            assertThat(results.single().isSuccess).isTrue()
        }

    @Test
    public fun `startGoogleSignIn — Unavailable — emits AuthResult Unavailable`(): Unit =
        runTest {
            val activity = mockk<FragmentActivity>()
            coEvery { googleSignInUseCase.getCredential(any()) } returns GoogleSignInResult.Unavailable

            val results = orchestrator.startGoogleSignIn(activity).toList()

            assertThat(results.single()).isEqualTo(AuthResult.Unavailable)
        }

    @Test
    public fun `startGoogleSignIn — Error — emits AuthResult Error General`(): Unit =
        runTest {
            val activity = mockk<FragmentActivity>()
            val cause = RuntimeException("Google Play unavailable")
            coEvery { googleSignInUseCase.getCredential(any()) } returns GoogleSignInResult.Error(cause)

            val results = orchestrator.startGoogleSignIn(activity).toList()

            val result = results.single()
            assertThat(result).isInstanceOf(AuthResult.Error.General::class.java)
            assertThat((result as AuthResult.Error.General).cause).isSameAs(cause)
        }

    @Test
    public fun `startEmailSignIn — error result — does not save session and emits error`(): Unit =
        runTest {
            every { emailPasswordUseCase.signIn(any(), any()) } returns
                flowOf(AuthResult.Error.WrongCredential)

            val results = orchestrator.startEmailSignIn("a@b.com", "wrong").toList()

            assertThat(results.single()).isEqualTo(AuthResult.Error.WrongCredential)
            coVerify(exactly = 0) { saveSessionUseCase.saveWithEmail(any()) }
        }

    @Test
    public fun `startEmailSignUp — anonymous user — calls linkAnonymousToEmail instead of signUp`(): Unit =
        runTest {
            val mockUser: FirebaseUser =
                mockk(relaxed = true) {
                    every { sendEmailVerification() } returns Tasks.forResult(null)
                }
            val mockFirebaseAuthResult: com.google.firebase.auth.AuthResult =
                mockk { every { user } returns mockUser }
            val mockAnonymousUser: FirebaseUser =
                mockk {
                    every { isAnonymous } returns true
                    every { linkWithCredential(any()) } returns Tasks.forResult(mockFirebaseAuthResult)
                }
            every { firebaseAuth.currentUser } returns mockAnonymousUser
            coEvery { saveSessionUseCase.saveWithEmail(any()) } returns Unit

            val results = orchestrator.startEmailSignUp("a@b.com", "pass1234").toList()

            assertThat(results.single()).isInstanceOf(AuthResult.Success::class.java)
            verify(exactly = 0) { emailPasswordUseCase.signUp(any(), any()) }
            coVerify { saveSessionUseCase.saveWithEmail(mockUser) }
        }

    @Test
    public fun `startGoogleSignIn — anon user linkWithCredential collision — falls back to signInWithCredential`(): Unit =
        runTest {
            val mockCredential: AuthCredential = mockk()
            val mockUser: FirebaseUser = mockk(relaxed = true)
            val mockFirebaseAuthResult: com.google.firebase.auth.AuthResult =
                mockk { every { user } returns mockUser }
            val collisionEx: FirebaseAuthUserCollisionException = mockk(relaxed = true)
            val mockAnonymousUser: FirebaseUser =
                mockk {
                    every { isAnonymous } returns true
                    every { linkWithCredential(mockCredential) } returns Tasks.forException(collisionEx)
                }
            val activity = mockk<FragmentActivity>()

            coEvery { googleSignInUseCase.getCredential(any()) } returns
                GoogleSignInResult.CredentialObtained(mockCredential)
            every { firebaseAuth.currentUser } returns mockAnonymousUser
            every { firebaseAuth.signInWithCredential(mockCredential) } returns
                Tasks.forResult(mockFirebaseAuthResult)
            coEvery { saveSessionUseCase.saveWithGoogle(mockUser) } returns Unit

            val results = orchestrator.startGoogleSignIn(activity).toList()

            assertThat(results.single()).isInstanceOf(AuthResult.Success::class.java)
            verify { firebaseAuth.signInWithCredential(mockCredential) }
            coVerify { saveSessionUseCase.saveWithGoogle(mockUser) }
        }
}
