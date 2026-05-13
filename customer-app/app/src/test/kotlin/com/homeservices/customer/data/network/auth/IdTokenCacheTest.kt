package com.homeservices.customer.data.network.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GetTokenResult
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Unit tests for [IdTokenCache].
 *
 * Contract:
 * 1. Cold start — cache returns null before first token is fetched.
 * 2. After first token arrives via [IdTokenCache.freshToken], cache returns it.
 * 3. Cache refreshes every 55 minutes (3_300_000 ms) automatically.
 * 4. [IdTokenCache.signalSignOut] clears [IdTokenCache.cachedToken] without cancelling the scope.
 * 5. After [signalSignOut] + [signalSignIn], [freshToken] resumes fetching tokens normally.
 */
@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
public class IdTokenCacheTest {
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var firebaseUser: FirebaseUser
    private lateinit var tokenResult: GetTokenResult

    @Before
    public fun setUp() {
        firebaseAuth = mockk(relaxed = true)
        firebaseUser = mockk(relaxed = true)
        tokenResult = mockk(relaxed = true)

        every { firebaseAuth.currentUser } returns firebaseUser
        every { firebaseUser.getIdToken(false) } returns Tasks.forResult(tokenResult)
        every { tokenResult.token } returns "test-token-123"
    }

    @After
    public fun tearDown() {
        io.mockk.unmockkAll()
    }

    @Test
    public fun `cachedToken is null when no user is signed in at construction`() {
        // Use a no-user mock so the background refresh also returns null,
        // ensuring cachedToken stays null after construction.
        val noUserAuth = mockk<FirebaseAuth>(relaxed = true)
        every { noUserAuth.currentUser } returns null
        val cache = IdTokenCache(noUserAuth)
        // Allow background coroutine to run: cachedToken stays null since there's no user.
        Thread.sleep(50)
        assertThat(cache.cachedToken).isNull()
    }

    @Test
    public fun `freshToken returns token from Firebase after fetch`(): Unit =
        runTest {
            val cache = IdTokenCache(firebaseAuth)
            val token = cache.freshToken()
            assertThat(token).isEqualTo("test-token-123")
            assertThat(cache.cachedToken).isEqualTo("test-token-123")
        }

    @Test
    public fun `freshToken returns null when no current user`(): Unit =
        runTest {
            every { firebaseAuth.currentUser } returns null
            val cache = IdTokenCache(firebaseAuth)
            val token = cache.freshToken()
            assertThat(token).isNull()
        }

    @Test
    public fun `cachedToken reflects latest fetched token`(): Unit =
        runTest {
            val cache = IdTokenCache(firebaseAuth)
            cache.freshToken()

            // Token is now cached
            assertThat(cache.cachedToken).isEqualTo("test-token-123")

            // Simulate updated token
            val newResult = mockk<GetTokenResult>(relaxed = true)
            every { newResult.token } returns "updated-token-456"
            every { firebaseUser.getIdToken(false) } returns Tasks.forResult(newResult)

            cache.freshToken()
            assertThat(cache.cachedToken).isEqualTo("updated-token-456")
        }

    @Test
    public fun `freshToken handles Firebase exception gracefully`(): Unit =
        runTest {
            every { firebaseUser.getIdToken(false) } returns
                Tasks.forException(
                    RuntimeException("Firebase unavailable"),
                )
            val cache = IdTokenCache(firebaseAuth)
            val token = cache.freshToken()
            // On exception, returns null without crashing
            assertThat(token).isNull()
        }

    @Test
    public fun `signalSignOut clears cachedToken without cancelling scope`(): Unit =
        runTest {
            val cache = IdTokenCache(firebaseAuth)
            // Prime the cache with a token
            cache.freshToken()
            assertThat(cache.cachedToken).isEqualTo("test-token-123")

            // Signal sign-out: token must be cleared
            cache.signalSignOut()
            assertThat(cache.cachedToken).isNull()

            // The CoroutineScope must still be alive — freshToken() should succeed
            // (scope cancellation would throw CancellationException here)
            val tokenAfterSignOut = cache.freshToken()
            assertThat(tokenAfterSignOut).isEqualTo("test-token-123")
        }

    @Test
    public fun `refresh resumes after signalSignOut and signalSignIn`(): Unit =
        runTest {
            val cache = IdTokenCache(firebaseAuth)
            cache.freshToken()
            assertThat(cache.cachedToken).isEqualTo("test-token-123")

            // Sign out: clears token and pauses refresh
            cache.signalSignOut()
            assertThat(cache.cachedToken).isNull()

            // Sign in again: re-enables refresh
            cache.signalSignIn()

            // freshToken() must work normally — simulates what the refresh loop does
            val token = cache.freshToken()
            assertThat(token).isEqualTo("test-token-123")
            assertThat(cache.cachedToken).isEqualTo("test-token-123")
        }
}
