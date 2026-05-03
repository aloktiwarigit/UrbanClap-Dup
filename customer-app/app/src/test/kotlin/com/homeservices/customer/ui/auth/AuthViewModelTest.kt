package com.homeservices.customer.ui.auth

import androidx.fragment.app.FragmentActivity
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.customer.domain.auth.AuthOrchestrator
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class AuthViewModelTest {
    private lateinit var orchestrator: AuthOrchestrator
    private lateinit var viewModel: AuthViewModel
    private val truecallerResultFlow = MutableSharedFlow<TruecallerAuthResult>(extraBufferCapacity = 1)
    private val testDispatcher = UnconfinedTestDispatcher()

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        orchestrator = mockk(relaxed = true)
        every { orchestrator.observeTruecallerResults() } returns truecallerResultFlow
        viewModel = AuthViewModel(orchestrator)
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial uiState is Idle`() {
        assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.Idle)
    }

    @Test
    public fun `initAuth transitions to TruecallerLoading when Truecaller is available`(): Unit =
        runTest {
            val activity = mockk<FragmentActivity>()
            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched

            viewModel.initAuth(activity)

            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.TruecallerLoading)
        }

    @Test
    public fun `initAuth transitions to MethodSelection when Truecaller is unavailable`(): Unit =
        runTest {
            val activity = mockk<FragmentActivity>()
            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.FallbackToOtp

            viewModel.initAuth(activity)

            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.MethodSelection)
        }

    @Test
    public fun `Truecaller Cancelled result transitions to MethodSelection`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched

            viewModel.initAuth(activity)
            truecallerResultFlow.emit(TruecallerAuthResult.Cancelled)

            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.MethodSelection)
        }

    @Test
    public fun `Truecaller Failure result transitions to MethodSelection`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched

            viewModel.initAuth(activity)
            truecallerResultFlow.emit(TruecallerAuthResult.Failure(errorType = 5))

            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.MethodSelection)
        }

    @Test
    public fun `Truecaller Success with AuthResult Error transitions to Error state`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched
            coEvery { orchestrator.completeWithTruecaller("0000") } returns
                AuthResult.Error.General(RuntimeException("session fail"))

            viewModel.initAuth(activity)
            truecallerResultFlow.emit(TruecallerAuthResult.Success("0000"))

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(0)
        }

    @Test
    public fun `onPhoneNumberSubmitted transitions to OtpEntry on CodeSent`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)

            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
            assertThat((viewModel.uiState.value as AuthUiState.OtpEntry).verificationId)
                .isEqualTo("verId")
        }

    @Test
    public fun `onPhoneNumberSubmitted handles OtpSendResult Error`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.Error(RuntimeException("network")))

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(3)
        }

    @Test
    public fun `onPhoneNumberSubmitted handles AutoVerified result`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val credential = mockk<PhoneAuthCredential>()
            val user = mockk<FirebaseUser> { every { uid } returns "uid-auto" }
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.AutoVerified(credential))
            every {
                orchestrator.signInWithCredential(credential)
            } returns flowOf(AuthResult.Success(user))
            coEvery { orchestrator.completeWithFirebase(user, "3210") } returns Unit

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)

            // After AutoVerified + Success, completeWithFirebase is called (state may stay as is)
            // The key assertion is no error state is set
            assertThat(viewModel.uiState.value).isNotInstanceOf(AuthUiState.Error::class.java)
        }

    @Test
    public fun `onOtpEntered does nothing when verificationId is null`(): Unit =
        runTest {
            // No prior sendOtp, so verificationId is null — onOtpEntered should be a no-op
            viewModel.onOtpEntered("123456")

            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.Idle)
        }

    @Test
    public fun `onOtpEntered transitions to Error with WrongCode`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
            every {
                orchestrator.verifyOtp("verId", "000000")
            } returns flowOf(AuthResult.Error.WrongCode)

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onOtpEntered("000000")

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(2)
        }

    @Test
    public fun `onOtpEntered handles RateLimited error`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
            every {
                orchestrator.verifyOtp("verId", "000000")
            } returns flowOf(AuthResult.Error.RateLimited)

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onOtpEntered("000000")

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(0)
        }

    @Test
    public fun `onOtpEntered handles CodeExpired error`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
            every {
                orchestrator.verifyOtp("verId", "000000")
            } returns flowOf(AuthResult.Error.CodeExpired)

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onOtpEntered("000000")

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(0)
        }

    @Test
    public fun `onOtpEntered handles General error`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
            every {
                orchestrator.verifyOtp("verId", "000000")
            } returns flowOf(AuthResult.Error.General(RuntimeException("unknown")))

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onOtpEntered("000000")

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(0)
        }

    @Test
    public fun `onOtpEntered handles Cancelled result`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
            every {
                orchestrator.verifyOtp("verId", "000000")
            } returns flowOf(AuthResult.Cancelled)

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onOtpEntered("000000")

            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
        }

    @Test
    public fun `onOtpEntered handles Success result`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            val user = mockk<FirebaseUser> { every { uid } returns "uid-success" }
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
            every {
                orchestrator.verifyOtp("verId", "123456")
            } returns flowOf(AuthResult.Success(user))
            coEvery { orchestrator.completeWithFirebase(user, "3210") } returns Unit

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onOtpEntered("123456")

            // Success: completeWithFirebase was called, no error state
            assertThat(viewModel.uiState.value).isNotInstanceOf(AuthUiState.Error::class.java)
        }

    @Test
    public fun `onOtpResendRequested resets attempts and re-sends OTP`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp(any(), activity, any())
            } returns flowOf(OtpSendResult.CodeSent("newVerId", resendToken))

            // First submit to set currentPhoneNumber
            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            // Now resend
            viewModel.onOtpResendRequested(activity)

            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
            assertThat((viewModel.uiState.value as AuthUiState.OtpEntry).verificationId)
                .isEqualTo("newVerId")
        }

    @Test
    public fun `onRetry resets state to MethodSelection when no phone is active`(): Unit =
        runTest {
            viewModel.onRetry()

            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.MethodSelection)
        }

    @Test
    public fun `Truecaller Success with AuthResult Success does not transition to Error`(): Unit =
        runTest(testDispatcher) {
            // Covers the false-branch of `if (authResult is AuthResult.Error)` in handleTruecallerResult
            val activity = mockk<FragmentActivity>()
            val user = mockk<FirebaseUser>()
            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched
            coEvery { orchestrator.completeWithTruecaller("0000") } returns AuthResult.Success(user)

            viewModel.initAuth(activity)
            truecallerResultFlow.emit(TruecallerAuthResult.Success("0000"))

            assertThat(viewModel.uiState.value).isNotInstanceOf(AuthUiState.Error::class.java)
        }

    @Test
    public fun `onOtpEntered handles General error shows generic message`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
            every {
                orchestrator.verifyOtp("verId", "000000")
            } returns flowOf(AuthResult.Error.General(RuntimeException("internal sdk error")))

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onOtpEntered("000000")

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
            assertThat((state as AuthUiState.Error).message).isEqualTo("Sign-in failed. Please try again.")
        }

    @Test
    public fun `onOtpEntered handles Unavailable result`(): Unit =
        runTest(testDispatcher) {
            // Covers the `is AuthResult.Unavailable` branch in handleFirebaseAuthResult
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
            every {
                orchestrator.verifyOtp("verId", "000000")
            } returns flowOf(AuthResult.Unavailable)

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onOtpEntered("000000")

            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
        }

    @Test
    public fun `method selection actions switch between phone email and method picker`() {
        viewModel.onPhoneSelected()
        assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.OtpEntry(phoneNumber = ""))

        viewModel.onEmailSelected()
        assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.EmailEntry())

        viewModel.onBackToMethodSelection()
        assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.MethodSelection)
    }

    @Test
    public fun `onEmailModeToggled alternates modes and preserves typed email`() {
        viewModel.onEmailModeToggled("person@example.com")
        assertThat(viewModel.uiState.value)
            .isEqualTo(
                AuthUiState.EmailEntry(
                    mode = AuthUiState.EmailEntry.Mode.SignUp,
                    prefillEmail = "person@example.com",
                ),
            )

        viewModel.onEmailModeToggled("")
        assertThat(viewModel.uiState.value)
            .isEqualTo(
                AuthUiState.EmailEntry(
                    mode = AuthUiState.EmailEntry.Mode.SignIn,
                    prefillEmail = "person@example.com",
                ),
            )
    }

    @Test
    public fun `onGoogleSignInClicked handles success cancelled unavailable and error states`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val user = mockk<FirebaseUser>()
            val cause = RuntimeException("google down")

            every { orchestrator.startGoogleSignIn(activity) } returns flowOf(AuthResult.Success(user))
            viewModel.onGoogleSignInClicked(activity)
            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.GoogleSigningIn)

            every { orchestrator.startGoogleSignIn(activity) } returns flowOf(AuthResult.Cancelled)
            viewModel.onGoogleSignInClicked(activity)
            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.MethodSelection)

            every { orchestrator.startGoogleSignIn(activity) } returns flowOf(AuthResult.Unavailable)
            viewModel.onGoogleSignInClicked(activity)
            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.Error(
                        message = "Google Sign-In is not available on this device. Use email or phone.",
                        retriesLeft = 0,
                    ),
                )

            every { orchestrator.startGoogleSignIn(activity) } returns flowOf(AuthResult.Error.General(cause))
            viewModel.onGoogleSignInClicked(activity)
            assertThat(viewModel.uiState.value)
                .isEqualTo(AuthUiState.Error("Sign-in failed. Please try again.", retriesLeft = 0))
        }

    @Test
    public fun `email auth validates blank fields before submitting`() {
        viewModel.onEmailSignInClicked("   ", "password")

        assertThat(viewModel.uiState.value)
            .isEqualTo(AuthUiState.Error("Enter your email and password.", retriesLeft = 0))
    }

    @Test
    public fun `email sign in success leaves submitting state while session completion navigates away`(): Unit =
        runTest(testDispatcher) {
            val user = mockk<FirebaseUser>()
            every { orchestrator.startEmailSignIn("person@example.com", "password") } returns
                flowOf(AuthResult.Success(user))

            viewModel.onEmailSignInClicked(" person@example.com ", "password")

            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.EmailSubmitting(
                        email = "person@example.com",
                        mode = AuthUiState.EmailEntry.Mode.SignIn,
                    ),
                )
        }

    @Test
    public fun `email sign in unavailable asks user to verify email`(): Unit =
        runTest(testDispatcher) {
            every { orchestrator.startEmailSignIn("person@example.com", "password") } returns
                flowOf(AuthResult.Unavailable)

            viewModel.onEmailSignInClicked("person@example.com", "password")

            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.EmailVerificationSent(
                        email = "person@example.com",
                        message = "Verify your email before continuing.",
                    ),
                )
        }

    @Test
    public fun `email sign up success shows verification email sent`(): Unit =
        runTest(testDispatcher) {
            val user = mockk<FirebaseUser>()
            every { orchestrator.startEmailSignUp("person@example.com", "password") } returns
                flowOf(AuthResult.Success(user))

            viewModel.onEmailSignUpClicked("person@example.com", "password")

            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.EmailVerificationSent(
                        email = "person@example.com",
                        message = "Verification email sent.",
                    ),
                )
        }

    @Test
    public fun `email auth cancelled returns to email entry with prefilled address`(): Unit =
        runTest(testDispatcher) {
            every { orchestrator.startEmailSignIn("person@example.com", "password") } returns
                flowOf(AuthResult.Cancelled)

            viewModel.onEmailSignInClicked("person@example.com", "password")

            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.EmailEntry(
                        mode = AuthUiState.EmailEntry.Mode.SignIn,
                        prefillEmail = "person@example.com",
                    ),
                )
        }

    @Test
    public fun `email auth maps domain errors to user messages`(): Unit =
        runTest(testDispatcher) {
            val cases =
                listOf(
                    AuthResult.Error.WrongCode to "Incorrect code",
                    AuthResult.Error.RateLimited to "Too many attempts. Try again later.",
                    AuthResult.Error.CodeExpired to "Code expired. Please resend.",
                    AuthResult.Error.WrongCredential to "Incorrect email or password.",
                    AuthResult.Error.UserNotFound to "Incorrect email or password.",
                    AuthResult.Error.EmailAlreadyInUse to "An account already exists with this email.",
                    AuthResult.Error.WeakPassword to "Password is too weak. Please choose a stronger one.",
                    AuthResult.Error.InvalidEmail to "The email address is not valid.",
                    AuthResult.Error.General(RuntimeException("sdk")) to "Sign-in failed. Please try again.",
                )

            cases.forEachIndexed { index, (error, message) ->
                val email = "person$index@example.com"
                every { orchestrator.startEmailSignIn(email, "password") } returns flowOf(error)

                viewModel.onEmailSignInClicked(email, "password")

                assertThat(viewModel.uiState.value)
                    .isEqualTo(AuthUiState.Error(message = message, retriesLeft = 0))
            }
        }

    @Test
    public fun `email verification continue handles all orchestrator outcomes`(): Unit =
        runTest(testDispatcher) {
            val user = mockk<FirebaseUser>()

            coEvery { orchestrator.completeCurrentEmailVerification() } returns AuthResult.Success(user)
            viewModel.onEmailVerificationContinue("person@example.com")
            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.EmailSubmitting(
                        email = "person@example.com",
                        mode = AuthUiState.EmailEntry.Mode.SignIn,
                    ),
                )

            coEvery { orchestrator.completeCurrentEmailVerification() } returns AuthResult.Unavailable
            viewModel.onEmailVerificationContinue("person@example.com")
            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.EmailVerificationSent(
                        email = "person@example.com",
                        message = "We still cannot confirm verification. Open the email, then try again.",
                    ),
                )

            coEvery { orchestrator.completeCurrentEmailVerification() } returns AuthResult.Cancelled
            viewModel.onEmailVerificationContinue("person@example.com")
            assertThat(viewModel.uiState.value)
                .isEqualTo(AuthUiState.EmailVerificationSent(email = "person@example.com"))

            coEvery { orchestrator.completeCurrentEmailVerification() } returns AuthResult.Error.InvalidEmail
            viewModel.onEmailVerificationContinue("person@example.com")
            assertThat(viewModel.uiState.value)
                .isEqualTo(AuthUiState.Error("The email address is not valid.", retriesLeft = 0))
        }

    @Test
    public fun `resend verification email reports success and failure`(): Unit =
        runTest(testDispatcher) {
            coEvery { orchestrator.resendCurrentEmailVerification() } returns Result.success(Unit)
            viewModel.onResendVerificationEmail("person@example.com")
            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.EmailVerificationSent(
                        email = "person@example.com",
                        message = "Verification email sent again.",
                    ),
                )

            coEvery { orchestrator.resendCurrentEmailVerification() } returns
                Result.failure(RuntimeException("network"))
            viewModel.onResendVerificationEmail("person@example.com")
            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.EmailVerificationSent(
                        email = "person@example.com",
                        message = "Could not resend the email. Try again in a moment.",
                    ),
                )
        }

    @Test
    public fun `forgot password validates email and handles success and failure`(): Unit =
        runTest(testDispatcher) {
            viewModel.onForgotPassword(" ")
            assertThat(viewModel.uiState.value)
                .isEqualTo(AuthUiState.Error("Enter your email first.", retriesLeft = 0))

            every { orchestrator.sendPasswordReset("person@example.com") } returns flowOf(Result.success(Unit))
            viewModel.onForgotPassword(" person@example.com ")
            assertThat(viewModel.uiState.value)
                .isEqualTo(
                    AuthUiState.EmailEntry(
                        mode = AuthUiState.EmailEntry.Mode.SignIn,
                        prefillEmail = "person@example.com",
                    ),
                )

            every { orchestrator.sendPasswordReset("person@example.com") } returns
                flowOf(Result.failure(RuntimeException("network")))
            viewModel.onForgotPassword("person@example.com")
            assertThat(viewModel.uiState.value)
                .isEqualTo(AuthUiState.Error("Could not send password reset email.", retriesLeft = 0))
        }

    @Test
    public fun `onRetry returns to OTP entry when a phone number is active`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.Error(RuntimeException("network")))

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onRetry()

            assertThat(viewModel.uiState.value)
                .isEqualTo(AuthUiState.OtpEntry(phoneNumber = "+919876543210"))
        }

    @Test
    public fun `onOtpEntered handles email-style firebase auth errors`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))

            val cases =
                listOf(
                    AuthResult.Error.WrongCredential to "Incorrect email or password.",
                    AuthResult.Error.UserNotFound to "Incorrect email or password.",
                    AuthResult.Error.EmailAlreadyInUse to "An account already exists with this email.",
                    AuthResult.Error.WeakPassword to "Password is too weak. Please choose a stronger one.",
                    AuthResult.Error.InvalidEmail to "The email address is not valid.",
                )

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            cases.forEachIndexed { index, (error, message) ->
                every { orchestrator.verifyOtp("verId", "11111$index") } returns flowOf(error)

                viewModel.onOtpEntered("11111$index")

                assertThat(viewModel.uiState.value)
                    .isEqualTo(AuthUiState.Error(message = message, retriesLeft = 0))
            }
        }
}
