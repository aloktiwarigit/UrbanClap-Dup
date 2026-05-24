package com.homeservices.customer.data.network.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GetTokenResult
import com.homeservices.customer.data.auth.SessionInvalidationReason
import com.homeservices.customer.data.auth.SessionInvalidator
import io.mockk.every
import io.mockk.mockk
import io.mockk.unmockkAll
import io.mockk.verify
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.util.concurrent.Executors
import javax.inject.Provider

/**
 * Unit tests for [FirebaseTokenAuthenticator].
 *
 * Contract (OkHttp Authenticator):
 * 1. On first 401, calls getIdToken(true) (force refresh), rebuilds request with new Bearer token.
 * 2. On second 401 (retry already attempted), returns null to stop retry loop.
 * 3. When getIdToken(true) fails, returns null (no retry with bad token).
 *
 * Note: [FirebaseTokenAuthenticator.authenticate] uses [Tasks.await] which must NOT be called
 * on the main thread. Tests invoke authenticate() via a background thread executor to match
 * OkHttp's worker-thread contract.
 */
@RunWith(RobolectricTestRunner::class)
public class FirebaseTokenAuthenticatorTest {
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var firebaseUser: FirebaseUser
    private lateinit var tokenResult: GetTokenResult
    private lateinit var sessionInvalidator: SessionInvalidator
    private lateinit var authenticator: FirebaseTokenAuthenticator

    /** Single-thread executor simulates the OkHttp worker thread. */
    private val executor = Executors.newSingleThreadExecutor()

    @Before
    public fun setUp() {
        firebaseAuth = mockk(relaxed = true)
        firebaseUser = mockk(relaxed = true)
        tokenResult = mockk(relaxed = true)
        sessionInvalidator = mockk(relaxed = true)

        every { firebaseAuth.currentUser } returns firebaseUser
        every { firebaseUser.getIdToken(true) } returns Tasks.forResult(tokenResult)
        every { tokenResult.token } returns "fresh-token-789"

        authenticator = FirebaseTokenAuthenticator(firebaseAuth, Provider { sessionInvalidator })
    }

    @After
    public fun tearDown() {
        executor.shutdown()
        unmockkAll()
    }

    /** Run [block] on the background executor and return its result — simulates OkHttp worker. */
    private fun <T> onWorkerThread(block: () -> T): T = executor.submit(block).get()

    @Test
    public fun `authenticate returns request with new Bearer token on first 401`() {
        val originalRequest =
            Request
                .Builder()
                .url("https://example.com/api/bookings")
                .build()

        val response = buildUnauthorizedResponse(originalRequest, priorResponseCount = 0)

        val result = onWorkerThread { authenticator.authenticate(null, response) }

        assertThat(result).isNotNull()
        assertThat(result!!.header("Authorization")).isEqualTo("Bearer fresh-token-789")
        verify(exactly = 1) { firebaseUser.getIdToken(true) }
    }

    @Test
    public fun `authenticate returns null on second 401 to stop infinite retry`() {
        val originalRequest =
            Request
                .Builder()
                .url("https://example.com/api/bookings")
                .header("Authorization", "Bearer old-token")
                .build()

        // Simulate that the request already has a prior response (retry happened)
        val firstResponse = buildUnauthorizedResponse(originalRequest, priorResponseCount = 0)
        val secondResponse =
            buildUnauthorizedResponse(
                originalRequest,
                priorResponseCount = 1,
                priorResponse = firstResponse,
            )

        val result = onWorkerThread { authenticator.authenticate(null, secondResponse) }

        assertThat(result).isNull()
        verify {
            sessionInvalidator.invalidateSession(SessionInvalidationReason.UnauthenticatedTokenRefresh)
        }
    }

    @Test
    public fun `authenticate returns null when no Firebase user is signed in`() {
        every { firebaseAuth.currentUser } returns null

        val originalRequest =
            Request
                .Builder()
                .url("https://example.com/api/bookings")
                .build()

        val response = buildUnauthorizedResponse(originalRequest, priorResponseCount = 0)
        val result = onWorkerThread { authenticator.authenticate(null, response) }

        assertThat(result).isNull()
        verify {
            sessionInvalidator.invalidateSession(SessionInvalidationReason.UnauthenticatedTokenRefresh)
        }
    }

    @Test
    public fun `authenticate returns null when getIdToken throws`() {
        every { firebaseUser.getIdToken(true) } returns
            Tasks.forException(
                RuntimeException("token refresh failed"),
            )

        val originalRequest =
            Request
                .Builder()
                .url("https://example.com/api/bookings")
                .build()

        val response = buildUnauthorizedResponse(originalRequest, priorResponseCount = 0)
        val result = onWorkerThread { authenticator.authenticate(null, response) }

        assertThat(result).isNull()
    }

    // ---- helpers ----

    private fun buildUnauthorizedResponse(
        request: Request,
        priorResponseCount: Int,
        priorResponse: Response? = null,
    ): Response {
        val builder =
            Response
                .Builder()
                .request(request)
                .protocol(Protocol.HTTP_1_1)
                .code(401)
                .message("Unauthorized")
        if (priorResponseCount > 0 && priorResponse != null) {
            builder.priorResponse(priorResponse)
        }
        return builder.build()
    }
}
