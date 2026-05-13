package com.homeservices.customer.data.auth

import android.content.SharedPreferences
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.customer.data.network.auth.IdTokenCache
import com.homeservices.customer.domain.auth.model.AuthState
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test

/**
 * Unit tests for [SessionManager.signOut] orchestration.
 *
 * These tests exercise the 6-step sign-out sequence with MockK mocks for
 * FirebaseAuth, FirebaseMessaging, and IdTokenCache. The existing
 * [SessionManagerTest] covers the prefs + AuthState round-trips via Robolectric.
 *
 * Sign-out contract:
 * 1. firebaseAuth.signOut() is called
 * 2. firebaseMessaging.unsubscribeFromTopic("customer_<uid>") is called
 * 3. firebaseMessaging.deleteToken() is called
 * 4. idTokenCache.cancelScope() is called
 * 5. prefs are cleared
 * 6. authState transitions to Unauthenticated
 * 7. The sequence completes even if individual steps throw (runCatching resilience)
 */
public class SessionManagerSignOutTest {
    private lateinit var prefs: SharedPreferences
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var firebaseMessaging: FirebaseMessaging
    private lateinit var idTokenCache: IdTokenCache
    private lateinit var sessionManager: SessionManager

    @Before
    public fun setUp() {
        prefs = mockk(relaxed = true)
        firebaseAuth = mockk(relaxed = true)
        firebaseMessaging = mockk(relaxed = true)
        idTokenCache = mockk(relaxed = true)

        // Default: prefs hold a saved uid so signOut has a uid to work with.
        val editor = mockk<SharedPreferences.Editor>(relaxed = true)
        every { prefs.getString("uid", null) } returns "user-42"
        every { prefs.getLong("session_created_at_epoch_ms", 0L) } returns System.currentTimeMillis()
        every { prefs.edit() } returns editor
        every { editor.clear() } returns editor
        every { editor.apply() } just runs
        every { idTokenCache.cancelScope() } just runs

        // FCM tasks return immediately (simulate Task<Void> success via relaxed mockk).
        // coEvery covers the .await() coroutine extension used in signOut.
        coEvery { firebaseMessaging.unsubscribeFromTopic(any()).await() } returns null
        coEvery { firebaseMessaging.deleteToken().await() } returns null

        sessionManager =
            SessionManager(
                prefs = prefs,
                firebaseAuth = firebaseAuth,
                firebaseMessaging = firebaseMessaging,
                idTokenCache = idTokenCache,
            )
    }

    @Test
    public fun `signOut calls firebaseAuth signOut`(): Unit =
        runTest {
            sessionManager.signOut()

            verify { firebaseAuth.signOut() }
        }

    @Test
    public fun `signOut unsubscribes from customer topic for current uid`(): Unit =
        runTest {
            sessionManager.signOut()

            coVerify { firebaseMessaging.unsubscribeFromTopic("customer_user-42").await() }
        }

    @Test
    public fun `signOut deletes FCM token`(): Unit =
        runTest {
            sessionManager.signOut()

            coVerify { firebaseMessaging.deleteToken().await() }
        }

    @Test
    public fun `signOut cancels idTokenCache scope`(): Unit =
        runTest {
            sessionManager.signOut()

            verify { idTokenCache.cancelScope() }
        }

    @Test
    public fun `signOut clears prefs and transitions to Unauthenticated`(): Unit =
        runTest {
            val editor = mockk<SharedPreferences.Editor>(relaxed = true)
            every { prefs.edit() } returns editor
            every { editor.clear() } returns editor
            every { editor.apply() } just runs

            sessionManager.signOut()

            verify { editor.clear() }
            assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
        }

    @Test
    public fun `signOut completes even if firebaseAuth signOut throws`(): Unit =
        runTest {
            every { firebaseAuth.signOut() } throws RuntimeException("Firebase Auth unavailable")

            sessionManager.signOut()

            // All remaining steps should still have executed
            coVerify { firebaseMessaging.unsubscribeFromTopic(any()).await() }
            coVerify { firebaseMessaging.deleteToken().await() }
            verify { idTokenCache.cancelScope() }
            assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
        }

    @Test
    public fun `signOut completes even if FCM unsubscribe throws`(): Unit =
        runTest {
            coEvery {
                firebaseMessaging.unsubscribeFromTopic(any()).await()
            } throws RuntimeException("FCM timeout")

            sessionManager.signOut()

            // deleteToken and subsequent steps must still run
            coVerify { firebaseMessaging.deleteToken().await() }
            verify { idTokenCache.cancelScope() }
            assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
        }

    @Test
    public fun `signOut is a no-op when no current uid`(): Unit =
        runTest {
            // Simulate no uid in prefs → readInitialState returns Unauthenticated
            every { prefs.getString("uid", null) } returns null
            val unauthManager =
                SessionManager(
                    prefs = prefs,
                    firebaseAuth = firebaseAuth,
                    firebaseMessaging = firebaseMessaging,
                    idTokenCache = idTokenCache,
                )

            unauthManager.signOut()

            // Firebase and FCM operations must NOT be called when no uid
            verify(exactly = 0) { firebaseAuth.signOut() }
            coVerify(exactly = 0) { firebaseMessaging.unsubscribeFromTopic(any()).await() }
        }
}
