package com.homeservices.customer.domain.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthProvider
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import com.homeservices.customer.domain.auth.model.AuthResult as AppAuthResult

public class SaveSessionUseCaseTest {
    private lateinit var sessionManager: SessionManager
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var useCase: SaveSessionUseCase

    @BeforeEach
    public fun setUp() {
        sessionManager = mockk(relaxed = true)
        firebaseAuth = mockk()
        useCase = SaveSessionUseCase(sessionManager, firebaseAuth)
    }

    @Test
    public fun `save stores uid and phoneLastFour in SessionManager`(): Unit =
        runTest {
            val user = mockk<FirebaseUser> { every { uid } returns "uid-abc" }
            coEvery {
                sessionManager.saveSession(any(), any(), any(), any(), any())
            } returns Unit

            useCase.save(user, "7890")

            coVerify {
                sessionManager.saveSession(
                    uid = "uid-abc",
                    phoneLastFour = "7890",
                    authProvider = AuthProvider.Phone,
                )
            }
        }

    @Test
    public fun `saveAnonymousWithPhone signs in anonymously and stores last 4 digits`(): Unit =
        runTest {
            val user = mockk<FirebaseUser> { every { uid } returns "anon-uid" }
            val authResultMock = mockk<AuthResult> { every { this@mockk.user } returns user }
            coEvery {
                sessionManager.saveSession(any(), any(), any(), any(), any())
            } returns Unit
            every { firebaseAuth.signInAnonymously() } returns Tasks.forResult(authResultMock)

            val result = useCase.saveAnonymousWithPhone("+919876541234")

            assertThat(result).isInstanceOf(AppAuthResult.Success::class.java)
            coVerify {
                sessionManager.saveSession(
                    uid = "anon-uid",
                    phoneLastFour = "1234",
                    authProvider = AuthProvider.Phone,
                )
            }
        }

    @Test
    public fun `saveAnonymousWithPhone returns General error when Firebase throws`(): Unit =
        runTest {
            every { firebaseAuth.signInAnonymously() } returns Tasks.forException(FirebaseNetworkException("network fail"))

            val result = useCase.saveAnonymousWithPhone("+919876541234")

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }

    @Test
    public fun `saveAnonymousWithPhone returns General error when Firebase user is null`(): Unit =
        runTest {
            // Covers the `result.user ?: return AuthResult.Error.General(...)` null branch
            val authResultMock = mockk<AuthResult> { every { this@mockk.user } returns null }
            every { firebaseAuth.signInAnonymously() } returns Tasks.forResult(authResultMock)

            val result = useCase.saveAnonymousWithPhone("+919876541234")

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }
}
