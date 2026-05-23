package com.homeservices.customer.observability

import com.homeservices.customer.domain.auth.model.AuthState
import io.mockk.every
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkStatic
import io.mockk.verify
import io.sentry.Breadcrumb
import io.sentry.Sentry
import io.sentry.protocol.User
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * TDD (E18-S06) — SentryContextBinder: user-context binding and navigation breadcrumbs.
 *
 * Tests verify:
 * 1. Authenticated state → Sentry.setUser called with hashed uid (never raw uid).
 * 2. Unauthenticated state → Sentry.setUser(null) called.
 * 3. recordNavigationBreadcrumb → Breadcrumb with correct from/to.
 */
public class SentryContextBinderTest {
    // mirrors SentryIdentity.SENTRY_USER_ID_HEX_LENGTH
    private companion object {
        const val EXPECTED_HASH_LENGTH = 16
    }

    @BeforeEach
    public fun setUp() {
        mockkStatic(Sentry::class)
        every { Sentry.setUser(any()) } returns Unit
        every { Sentry.setUser(null) } returns Unit
        every { Sentry.addBreadcrumb(any<Breadcrumb>()) } returns Unit
    }

    @AfterEach
    public fun tearDown() {
        unmockkStatic(Sentry::class)
    }

    // ─── User-context binding ────────────────────────────────────────────────

    @Test
    public fun `bindAuthState sets hashed user on Authenticated`(): Unit =
        runTest {
            val uid = "firebase-raw-uid-should-not-appear"
            val state = flowOf(AuthState.Authenticated(uid = uid))
            val userSlot = slot<User>()
            every { Sentry.setUser(capture(userSlot)) } returns Unit

            SentryContextBinder.bindAuthState(state)

            verify(exactly = 1) { Sentry.setUser(any<User>()) }
            val sentryUser = userSlot.captured
            // Must be EXPECTED_HASH_LENGTH hex chars (hashed)
            assertThat(sentryUser.id).hasSize(EXPECTED_HASH_LENGTH)
            assertThat(sentryUser.id).matches("[0-9a-f]{$EXPECTED_HASH_LENGTH}")
            // Raw UID must not appear in the Sentry user id
            assertThat(sentryUser.id).doesNotContain(uid)
        }

    @Test
    public fun `bindAuthState sets null user on Unauthenticated`(): Unit =
        runTest {
            val state = flowOf<AuthState>(AuthState.Unauthenticated)

            SentryContextBinder.bindAuthState(state)

            verify(exactly = 1) { Sentry.setUser(null) }
        }

    @Test
    public fun `bindAuthState handles auth state transitions`(): Unit =
        runTest {
            // Collect first emission only (Authenticated)
            SentryContextBinder.bindAuthState(flowOf(AuthState.Authenticated(uid = "user-abc")))
            verify(exactly = 1) { Sentry.setUser(any<User>()) }

            // Now simulate transition to Unauthenticated
            SentryContextBinder.bindAuthState(flowOf(AuthState.Unauthenticated))
            verify(exactly = 1) { Sentry.setUser(null) }
        }

    // ─── Navigation breadcrumbs ──────────────────────────────────────────────

    @Test
    public fun `recordNavigationBreadcrumb adds breadcrumb with from and to`() {
        val crumbSlot = slot<Breadcrumb>()
        every { Sentry.addBreadcrumb(capture(crumbSlot)) } returns Unit

        SentryContextBinder.recordNavigationBreadcrumb(from = "auth", to = "main")

        verify(exactly = 1) { Sentry.addBreadcrumb(any<Breadcrumb>()) }
        val crumb = crumbSlot.captured
        assertThat(crumb.data).containsEntry("from", "auth")
        assertThat(crumb.data).containsEntry("to", "main")
    }

    @Test
    public fun `recordNavigationBreadcrumb uses (initial) when from is null`() {
        val crumbSlot = slot<Breadcrumb>()
        every { Sentry.addBreadcrumb(capture(crumbSlot)) } returns Unit

        SentryContextBinder.recordNavigationBreadcrumb(from = null, to = "auth")

        val crumb = crumbSlot.captured
        assertThat(crumb.data).containsEntry("from", "(initial)")
        assertThat(crumb.data).containsEntry("to", "auth")
    }

    @Test
    public fun `recordNavigationBreadcrumb uses (unknown) when to is null`() {
        val crumbSlot = slot<Breadcrumb>()
        every { Sentry.addBreadcrumb(capture(crumbSlot)) } returns Unit

        SentryContextBinder.recordNavigationBreadcrumb(from = "main", to = null)

        val crumb = crumbSlot.captured
        assertThat(crumb.data).containsEntry("to", "(unknown)")
    }

    @Test
    public fun `recordNavigationBreadcrumb sets category to navigation`() {
        val crumbSlot = slot<Breadcrumb>()
        every { Sentry.addBreadcrumb(capture(crumbSlot)) } returns Unit

        SentryContextBinder.recordNavigationBreadcrumb(from = "home", to = "settings")

        val crumb = crumbSlot.captured
        assertThat(crumb.category).isEqualTo("navigation")
    }
}
