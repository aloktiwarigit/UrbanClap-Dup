package com.homeservices.customer.domain.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.domain.auth.model.AuthResult as AppAuthResult
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class EmailPasswordUseCaseTest {

    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var sut: EmailPasswordUseCase

    @BeforeEach
    public fun setUp(): Unit {
        firebaseAuth = mockk()
        sut = EmailPasswordUseCase(firebaseAuth)
    }

    // ── signIn ──────────────────────────────────────────────────────────────

    @Test
    public fun `signIn — success — emits Success with FirebaseUser`(): Unit = runTest {
        val mockUser: FirebaseUser = mockk(relaxed = true)
        val mockAuthResult: AuthResult = mockk { every { user } returns mockUser }
        every { firebaseAuth.signInWithEmailAndPassword(any(), any()) } returns
            Tasks.forResult(mockAuthResult)

        val results = sut.signIn("a@b.com", "pass1234").toList()

        assertThat(results).hasSize(1)
        assertThat(results.single()).isInstanceOf(AppAuthResult.Success::class.java)
    }

    @Test
    public fun `signIn — FirebaseAuthInvalidCredentialsException WRONG_PASSWORD — emits WrongCredential`(): Unit = runTest {
        val ex: FirebaseAuthInvalidCredentialsException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_WRONG_PASSWORD"
        }
        every { firebaseAuth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

        val results = sut.signIn("a@b.com", "wrong").toList()

        assertThat(results.single()).isEqualTo(AppAuthResult.Error.WrongCredential)
    }

    @Test
    public fun `signIn — FirebaseAuthInvalidCredentialsException INVALID_EMAIL — emits InvalidEmail`(): Unit = runTest {
        val ex: FirebaseAuthInvalidCredentialsException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_INVALID_EMAIL"
        }
        every { firebaseAuth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

        val results = sut.signIn("not-an-email", "pass").toList()

        assertThat(results.single()).isEqualTo(AppAuthResult.Error.InvalidEmail)
    }

    @Test
    public fun `signIn — FirebaseAuthInvalidUserException USER_NOT_FOUND — emits UserNotFound`(): Unit = runTest {
        val ex: FirebaseAuthInvalidUserException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_USER_NOT_FOUND"
        }
        every { firebaseAuth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

        val results = sut.signIn("nobody@b.com", "pass").toList()

        assertThat(results.single()).isEqualTo(AppAuthResult.Error.UserNotFound)
    }

    // ── signUp ──────────────────────────────────────────────────────────────

    @Test
    public fun `signUp — success — emits Success`(): Unit = runTest {
        val mockUser: FirebaseUser = mockk(relaxed = true)
        val mockAuthResult: AuthResult = mockk { every { user } returns mockUser }
        every { firebaseAuth.createUserWithEmailAndPassword(any(), any()) } returns
            Tasks.forResult(mockAuthResult)

        val results = sut.signUp("new@b.com", "pass1234").toList()

        assertThat(results.single()).isInstanceOf(AppAuthResult.Success::class.java)
    }

    @Test
    public fun `signUp — FirebaseAuthUserCollisionException — emits EmailAlreadyInUse`(): Unit = runTest {
        val ex: FirebaseAuthUserCollisionException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_EMAIL_ALREADY_IN_USE"
        }
        every { firebaseAuth.createUserWithEmailAndPassword(any(), any()) } returns
            Tasks.forException(ex)

        val results = sut.signUp("exists@b.com", "pass1234").toList()

        assertThat(results.single()).isEqualTo(AppAuthResult.Error.EmailAlreadyInUse)
    }

    @Test
    public fun `signUp — FirebaseAuthWeakPasswordException — emits WeakPassword`(): Unit = runTest {
        val ex: FirebaseAuthWeakPasswordException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_WEAK_PASSWORD"
        }
        every { firebaseAuth.createUserWithEmailAndPassword(any(), any()) } returns
            Tasks.forException(ex)

        val results = sut.signUp("a@b.com", "12").toList()

        assertThat(results.single()).isEqualTo(AppAuthResult.Error.WeakPassword)
    }

    @Test
    public fun `signUp — FirebaseAuthInvalidCredentialsException INVALID_EMAIL — emits InvalidEmail`(): Unit = runTest {
        val ex: FirebaseAuthInvalidCredentialsException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_INVALID_EMAIL"
        }
        every { firebaseAuth.createUserWithEmailAndPassword(any(), any()) } returns
            Tasks.forException(ex)

        val results = sut.signUp("not-an-email", "pass1234").toList()

        assertThat(results.single()).isEqualTo(AppAuthResult.Error.InvalidEmail)
    }

    // ── sendPasswordReset ────────────────────────────────────────────────────

    @Test
    public fun `sendPasswordReset — success — emits Result success`(): Unit = runTest {
        every { firebaseAuth.sendPasswordResetEmail(any()) } returns Tasks.forResult(null)

        val results = sut.sendPasswordReset("a@b.com").toList()

        assertThat(results.single().isSuccess).isTrue()
    }

    @Test
    public fun `sendPasswordReset — failure — emits Result failure`(): Unit = runTest {
        every { firebaseAuth.sendPasswordResetEmail(any()) } returns
            Tasks.forException(RuntimeException("network"))

        val results = sut.sendPasswordReset("a@b.com").toList()

        assertThat(results.single().isFailure).isTrue()
    }
}
