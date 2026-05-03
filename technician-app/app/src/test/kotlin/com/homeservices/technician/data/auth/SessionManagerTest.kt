package com.homeservices.technician.data.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.test.core.app.ApplicationProvider
import com.homeservices.technician.domain.auth.model.AuthProvider
import com.homeservices.technician.domain.auth.model.AuthState
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
public class SessionManagerTest {
    private lateinit var prefs: SharedPreferences
    private lateinit var sessionManager: SessionManager

    @Before
    public fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        prefs = context.getSharedPreferences("test_auth_session", Context.MODE_PRIVATE)
        sessionManager = SessionManager(prefs)
    }

    @After
    public fun tearDown() {
        prefs.edit().clear().apply()
    }

    @Test
    public fun `initial state is Unauthenticated when prefs are empty`() {
        assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
    }

    @Test
    public fun `saveSession stores uid and phoneLastFour and transitions to Authenticated`(): Unit =
        runTest {
            sessionManager.saveSession("uid-abc", "5678")

            assertThat(sessionManager.authState.value)
                .isEqualTo(AuthState.Authenticated(uid = "uid-abc", phoneLastFour = "5678"))
            assertThat(prefs.getString("uid", null)).isEqualTo("uid-abc")
            assertThat(prefs.getString("phone_last_four", null)).isEqualTo("5678")
        }

    @Test
    public fun `clearSession removes all prefs and transitions to Unauthenticated`(): Unit =
        runTest {
            sessionManager.saveSession("uid-abc", "5678")
            sessionManager.clearSession()

            assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
            assertThat(prefs.getString("uid", null)).isNull()
        }

    @Test
    public fun `initial state is Authenticated when valid session exists in prefs`() {
        prefs
            .edit()
            .putString("uid", "uid-xyz")
            .putString("phone_last_four", "1234")
            .putLong("session_created_at_epoch_ms", System.currentTimeMillis())
            .apply()
        val freshManager = SessionManager(prefs)

        assertThat(freshManager.authState.value)
            .isEqualTo(AuthState.Authenticated(uid = "uid-xyz", phoneLastFour = "1234"))
    }

    @Test
    public fun `initial state is Unauthenticated when session is older than 180 days`() {
        val expiredTs = System.currentTimeMillis() - (181L * 24 * 60 * 60 * 1000)
        prefs
            .edit()
            .putString("uid", "uid-old")
            .putString("phone_last_four", "9999")
            .putLong("session_created_at_epoch_ms", expiredTs)
            .apply()
        val freshManager = SessionManager(prefs)

        assertThat(freshManager.authState.value).isEqualTo(AuthState.Unauthenticated)
        assertThat(prefs.getString("uid", null)).isNull()
    }

    @Test
    public fun `initial state is Unauthenticated when session_created_at is zero`() {
        // Covers the `createdAt == 0L` branch in readInitialState
        prefs
            .edit()
            .putString("uid", "uid-zero")
            .putString("phone_last_four", "1111")
            .putLong("session_created_at_epoch_ms", 0L)
            .apply()
        val freshManager = SessionManager(prefs)

        assertThat(freshManager.authState.value).isEqualTo(AuthState.Unauthenticated)
        assertThat(prefs.getString("uid", null)).isNull()
    }

    @Test
    public fun `initial state handles missing phoneLastFour in prefs gracefully`() {
        // Covers the `prefs.getString(KEY_PHONE_LAST_FOUR, "") ?: ""` null branch
        prefs
            .edit()
            .putString("uid", "uid-nophone")
            // intentionally not setting phone_last_four — defaults to empty string
            .putLong("session_created_at_epoch_ms", System.currentTimeMillis())
            .apply()
        val freshManager = SessionManager(prefs)

        val state = freshManager.authState.value
        assertThat(state).isInstanceOf(AuthState.Authenticated::class.java)
        assertThat((state as AuthState.Authenticated).phoneLastFour).isNull()
        assertThat(state.authProvider).isEqualTo(AuthProvider.Phone)
    }

    @Test
    public fun `saveSession with Email provider round-trips email and displayName`(): Unit =
        runTest {
            sessionManager.saveSession(
                uid = "uid-email",
                email = "tech@example.com",
                displayName = "Tech User",
                authProvider = AuthProvider.Email,
            )

            val state = sessionManager.authState.value as AuthState.Authenticated
            assertThat(state.email).isEqualTo("tech@example.com")
            assertThat(state.displayName).isEqualTo("Tech User")
            assertThat(state.authProvider).isEqualTo(AuthProvider.Email)
            assertThat(prefs.getString("auth_provider", null)).isEqualTo("email")
        }
}
