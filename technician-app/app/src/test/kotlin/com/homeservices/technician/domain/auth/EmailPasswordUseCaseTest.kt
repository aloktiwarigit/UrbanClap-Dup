package com.homeservices.technician.domain.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.FirebaseException
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.auth.FirebaseUser
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import com.homeservices.technician.domain.auth.model.AuthResult as AppAuthResult

public class EmailPasswordUseCaseTest {
    private lateinit var auth: FirebaseAuth
    private lateinit var useCase: EmailPasswordUseCase

    @BeforeEach
    public fun setUp() {
        auth = mockk()
        useCase = EmailPasswordUseCase(auth)
    }

    private fun mockAuthResult(user: FirebaseUser) = mockk<AuthResult> { every { this@mockk.user } returns user }

    // --- signIn ---

    @Test
    public fun `signIn returns Success on valid credentials`(): Unit =
        runTest {
            val user = mockk<FirebaseUser>()
            every { auth.signInWithEmailAndPassword("a@b.com", "p4ssword") } returns
                Tasks.forResult(mockAuthResult(user))

            val result = useCase.signIn("a@b.com", "p4ssword").first()

            assertThat(result).isInstanceOf(AppAuthResult.Success::class.java)
            assertThat((result as AppAuthResult.Success).user).isEqualTo(user)
        }

    @Test
    public fun `signIn returns InvalidEmail when errorCode is ERROR_INVALID_EMAIL`(): Unit =
        runTest {
            val ex =
                mockk<FirebaseAuthInvalidCredentialsException> {
                    every { errorCode } returns "ERROR_INVALID_EMAIL"
                }
            every { auth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

            val result = useCase.signIn("bad", "pass").first()

            assertThat(result).isEqualTo(AppAuthResult.Error.InvalidEmail)
        }

    @Test
    public fun `signIn returns WrongCredential for other invalid credentials`(): Unit =
        runTest {
            val ex =
                mockk<FirebaseAuthInvalidCredentialsException> {
                    every { errorCode } returns "ERROR_WRONG_PASSWORD"
                }
            every { auth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

            val result = useCase.signIn("a@b.com", "wrong").first()

            assertThat(result).isEqualTo(AppAuthResult.Error.WrongCredential)
        }

    @Test
    public fun `signIn returns UserNotFound for FirebaseAuthInvalidUserException`(): Unit =
        runTest {
            val ex =
                mockk<FirebaseAuthInvalidUserException> {
                    every { errorCode } returns "ERROR_USER_NOT_FOUND"
                }
            every { auth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

            val result = useCase.signIn("notfound@b.com", "pass").first()

            assertThat(result).isEqualTo(AppAuthResult.Error.UserNotFound)
        }

    @Test
    public fun `signIn returns General for generic FirebaseException`(): Unit =
        runTest {
            val ex = mockk<FirebaseException>()
            every { auth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

            val result = useCase.signIn("a@b.com", "pass").first()

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }

    // --- signUp ---

    @Test
    public fun `signUp returns Success on new account`(): Unit =
        runTest {
            val user = mockk<FirebaseUser>()
            every { auth.createUserWithEmailAndPassword("new@b.com", "str0ng") } returns
                Tasks.forResult(mockAuthResult(user))

            val result = useCase.signUp("new@b.com", "str0ng").first()

            assertThat(result).isInstanceOf(AppAuthResult.Success::class.java)
        }

    @Test
    public fun `signUp returns EmailAlreadyInUse when account exists`(): Unit =
        runTest {
            val ex =
                mockk<FirebaseAuthUserCollisionException> {
                    every { errorCode } returns "ERROR_EMAIL_ALREADY_IN_USE"
                }
            every { auth.createUserWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

            val result = useCase.signUp("existing@b.com", "pass").first()

            assertThat(result).isEqualTo(AppAuthResult.Error.EmailAlreadyInUse)
        }

    @Test
    public fun `signUp returns WeakPassword for weak password`(): Unit =
        runTest {
            val ex =
                mockk<FirebaseAuthWeakPasswordException> {
                    every { errorCode } returns "ERROR_WEAK_PASSWORD"
                }
            every { auth.createUserWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

            val result = useCase.signUp("a@b.com", "123").first()

            assertThat(result).isEqualTo(AppAuthResult.Error.WeakPassword)
        }

    @Test
    public fun `signUp returns InvalidEmail for bad email format`(): Unit =
        runTest {
            val ex =
                mockk<FirebaseAuthInvalidCredentialsException> {
                    every { errorCode } returns "ERROR_INVALID_EMAIL"
                }
            every { auth.createUserWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

            val result = useCase.signUp("notanemail", "pass").first()

            assertThat(result).isEqualTo(AppAuthResult.Error.InvalidEmail)
        }

    @Test
    public fun `signUp returns General for unrecognised FirebaseException`(): Unit =
        runTest {
            val ex = mockk<FirebaseException>()
            every { auth.createUserWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

            val result = useCase.signUp("a@b.com", "pass").first()

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }

    // --- sendPasswordReset ---

    @Test
    public fun `sendPasswordReset returns success on valid email`(): Unit =
        runTest {
            every { auth.sendPasswordResetEmail("a@b.com") } returns Tasks.forResult(null)

            val result = useCase.sendPasswordReset("a@b.com").first()

            assertThat(result.isSuccess).isTrue()
        }

    @Test
    public fun `sendPasswordReset returns failure when Firebase throws`(): Unit =
        runTest {
            val ex = RuntimeException("network error")
            every { auth.sendPasswordResetEmail(any()) } returns Tasks.forException(ex)

            val result = useCase.sendPasswordReset("a@b.com").first()

            assertThat(result.isFailure).isTrue()
        }
}
