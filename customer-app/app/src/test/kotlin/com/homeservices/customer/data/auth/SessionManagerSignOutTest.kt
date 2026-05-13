package com.homeservices.customer.data.auth

import android.content.SharedPreferences
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.customer.data.network.auth.IdTokenCache
import com.homeservices.customer.domain.auth.model.AuthState
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
 * These tests exercise the local-state-first sign-out sequence with MockK mocks for
 * FirebaseAuth, FirebaseMessaging, and IdTokenCache. The existing
 * [SessionManagerTest] covers the prefs + AuthState round-trips via Robolectric.
 *
 * Sign-out contract (local-state-first ordering):
 * 1. prefs are cleared FIRST (survives process kill; prevents stale-uid auth on cold start)
 * 2. authState transitions to Unauthenticated BEFORE remote cleanup
 * 3. idTokenCache.signalSignOut() clears cached token and pauses refresh loop (no scope cancel)
 * 4. firebaseAuth.signOut() is called (best-effort)
 * 5. firebaseMessaging.unsubscribeFromTopic("customer_<uid>") is called (best-effort)
 * 6. firebaseMessaging.deleteToken() is called (best-effort)
 * 7. The sequence completes even if individual steps throw (runCatching resilience)
 * 8. FCM cleanup is skipped if generation changes mid-flight (concurrent sign-in guard)
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
        every { idTokenCache.signalSignOut() } just runs
        every { idTokenCache.signalSignIn() } just runs
        // currentSignOutGeneration returns a stable value (simulates the generation after signalSignOut)
        every { idTokenCache.currentSignOutGeneration() } returns 1

        // FCM methods return real completed Tasks so .await() resolves correctly in coroutines.
        every { firebaseMessaging.unsubscribeFromTopic(any()) } returns Tasks.forResult(null)
        every { firebaseMessaging.deleteToken() } returns Tasks.forResult(null)

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

            verify { firebaseMessaging.unsubscribeFromTopic("customer_user-42") }
        }

    @Test
    public fun `signOut deletes FCM token`(): Unit =
        runTest {
            sessionManager.signOut()

            verify { firebaseMessaging.deleteToken() }
        }

    @Test
    public fun `signOut signals IdTokenCache to clear cached token`(): Unit =
        runTest {
            sessionManager.signOut()

            verify { idTokenCache.signalSignOut() }
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
    public fun `signOut clears prefs and emits Unauthenticated even when firebaseAuth signOut throws`(): Unit =
        runTest {
            every { firebaseAuth.signOut() } throws RuntimeException("Firebase Auth unavailable")

            sessionManager.signOut()

            // Local state must be cleared regardless of Firebase failure
            verify { prefs.edit() }
            assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
            // FCM cleanup should still have been attempted after Firebase failure
            verify { firebaseMessaging.unsubscribeFromTopic(any()) }
            verify { firebaseMessaging.deleteToken() }
        }

    @Test
    public fun `signOut emits Unauthenticated synchronously before FCM cleanup completes`(): Unit =
        runTest {
            // FCM unsubscribe suspends (simulated by a completed task — enough to verify ordering
            // because our signOut inverts the sequence so authState is set before .await() calls)
            var authStateAtFcmCall: AuthState? = null
            every { firebaseMessaging.unsubscribeFromTopic(any()) } answers {
                // Capture authState at the moment FCM is called — must already be Unauthenticated
                authStateAtFcmCall = sessionManager.authState.value
                Tasks.forResult(null)
            }

            sessionManager.signOut()

            assertThat(authStateAtFcmCall).isEqualTo(AuthState.Unauthenticated)
        }

    @Test
    public fun `signOut completes even if FCM unsubscribe throws`(): Unit =
        runTest {
            every {
                firebaseMessaging.unsubscribeFromTopic(any())
            } throws RuntimeException("FCM timeout")

            sessionManager.signOut()

            // deleteToken must still run after FCM unsubscribe failure
            verify { firebaseMessaging.deleteToken() }
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
            verify(exactly = 0) { firebaseMessaging.unsubscribeFromTopic(any()) }
        }

    @Test
    public fun `subsequent saveSession after signOut restores token-fetch behavior`(): Unit =
        runTest {
            sessionManager.signOut()

            // signalSignIn should be called when saveSession is called after sign-out
            sessionManager.saveSession(uid = "user-99", authProvider = com.homeservices.customer.domain.auth.model.AuthProvider.Phone)

            verify { idTokenCache.signalSignIn() }
            assertThat(sessionManager.authState.value).isInstanceOf(AuthState.Authenticated::class.java)
        }

    // -------------------------------------------------------------------------
    // NEW: FIX 3 — FCM cleanup is a no-op when a new sign-in has happened
    // -------------------------------------------------------------------------

    /**
     * FIX 3: signOut FCM cleanup steps are skipped when a concurrent sign-in has bumped
     * the signOutGeneration before the FCM awaits run.
     *
     * Scenario:
     * - signOut() calls idTokenCache.signalSignOut() (generation becomes 1)
     * - signOut() captures signOutGen = 1
     * - A concurrent sign-in calls idTokenCache.signalSignIn() which bumps generation to 2
     * - signOut() checks idTokenCache.currentSignOutGeneration() before FCM ops → 2 ≠ 1 → skip
     *
     * We simulate this by making currentSignOutGeneration() return a different value
     * (2) after signalSignOut() has been called (simulating the race with saveSession).
     */
    @Test
    public fun `signOut FCM cleanup is no-op when a new sign-in has changed signOutGeneration`(): Unit =
        runTest {
            // signalSignOut increments generation to 1; capture returns 1
            var generationCallCount = 0
            every { idTokenCache.currentSignOutGeneration() } answers {
                generationCallCount++
                // First call (after signalSignOut, to capture signOutGen) → 1
                // Subsequent calls (inside FCM guard checks) → 2 (simulates concurrent signalSignIn)
                if (generationCallCount <= 1) 1 else 2
            }

            sessionManager.signOut()

            // FCM operations must NOT be called since generation changed before the guards ran
            verify(exactly = 0) { firebaseMessaging.unsubscribeFromTopic(any()) }
            verify(exactly = 0) { firebaseMessaging.deleteToken() }
            // Auth state and prefs must still be cleaned up (local state is unaffected)
            assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
            verify { firebaseAuth.signOut() }
        }
}
