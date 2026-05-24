package com.homeservices.customer.data.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.test.core.app.ApplicationProvider
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.customer.data.device.DeviceTokenRegistrar
import com.homeservices.customer.data.network.auth.IdTokenCache
import com.homeservices.customer.domain.auth.model.AuthProvider
import com.homeservices.customer.domain.auth.model.AuthState
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
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
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var firebaseMessaging: FirebaseMessaging
    private lateinit var idTokenCache: IdTokenCache
    private lateinit var deviceTokenRegistrar: DeviceTokenRegistrar
    private lateinit var sessionManager: SessionManager

    @Before
    public fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        prefs = context.getSharedPreferences("test_auth_session", Context.MODE_PRIVATE)
        firebaseAuth = mockk(relaxed = true)
        firebaseMessaging = mockk(relaxed = true)
        idTokenCache = mockk(relaxed = true)
        deviceTokenRegistrar = mockk(relaxed = true)
        every { firebaseAuth.currentUser } returns null
        every { firebaseAuth.addAuthStateListener(any()) } answers {
            firstArg<FirebaseAuth.AuthStateListener>().onAuthStateChanged(firebaseAuth)
        }
        sessionManager = buildSessionManager(prefs)
    }

    @After
    public fun tearDown() {
        prefs.edit().clear().apply()
    }

    /** Convenience factory to avoid repeating relaxed mock boilerplate across tests. */
    private fun buildSessionManager(
        sharedPrefs: SharedPreferences,
        registrar: DeviceTokenRegistrar = deviceTokenRegistrar,
    ): SessionManager =
        SessionManager(
            prefs = sharedPrefs,
            firebaseAuth = firebaseAuth,
            firebaseMessaging = firebaseMessaging,
            idTokenCache = idTokenCache,
            deviceTokenRegistrar = registrar,
        )

    private fun firebaseUser(
        uid: String,
        email: String? = null,
        displayName: String? = null,
        phoneNumber: String? = null,
    ): FirebaseUser =
        mockk(relaxed = true) {
            every { this@mockk.uid } returns uid
            every { this@mockk.email } returns email
            every { this@mockk.displayName } returns displayName
            every { this@mockk.phoneNumber } returns phoneNumber
        }

    @Test
    public fun `initial state is Unauthenticated when prefs are empty`() {
        assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
    }

    @Test
    public fun `saveSession stores uid and phoneLastFour and transitions to Authenticated`(): Unit =
        runTest {
            val user = firebaseUser("uid-abc")
            every { firebaseAuth.currentUser } returns user

            sessionManager.saveSession(user, "5678")

            assertThat(sessionManager.authState.value)
                .isEqualTo(AuthState.Authenticated(uid = "uid-abc", phoneLastFour = "5678"))
            assertThat(prefs.getString("uid", null)).isEqualTo("uid-abc")
            assertThat(prefs.getString("phone_last_four", null)).isEqualTo("5678")
        }

    @Test
    public fun `saveSession calls deviceTokenRegistrar register for existing FCM token coverage`(): Unit =
        runTest {
            val user = firebaseUser("uid-abc")
            every { firebaseAuth.currentUser } returns user

            sessionManager.saveSession(user, "5678")

            coVerify(exactly = 1) { deviceTokenRegistrar.register() }
        }

    @Test
    public fun `clearSession removes all prefs and transitions to Unauthenticated`(): Unit =
        runTest {
            val user = firebaseUser("uid-abc")
            every { firebaseAuth.currentUser } returns user

            sessionManager.saveSession(user, "5678")
            sessionManager.clearSession()

            assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
            assertThat(prefs.getString("uid", null)).isNull()
        }

    @Test
    public fun `initial state is Authenticated when valid session exists in prefs`() {
        every { firebaseAuth.currentUser } returns firebaseUser("uid-xyz")
        prefs
            .edit()
            .putString("uid", "uid-xyz")
            .putString("phone_last_four", "1234")
            .putLong("session_created_at_epoch_ms", System.currentTimeMillis())
            .apply()
        val freshManager = buildSessionManager(prefs)

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
        val freshManager = buildSessionManager(prefs)

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
        val freshManager = buildSessionManager(prefs)

        assertThat(freshManager.authState.value).isEqualTo(AuthState.Unauthenticated)
        assertThat(prefs.getString("uid", null)).isNull()
    }

    @Test
    public fun `initial state handles null phoneLastFour in prefs gracefully`() {
        every { firebaseAuth.currentUser } returns firebaseUser("uid-nophone")
        // Covers the `prefs.getString(KEY_PHONE_LAST_FOUR, "") ?: ""` null branch
        prefs
            .edit()
            .putString("uid", "uid-nophone")
            // intentionally not setting phone_last_four — defaults to empty string
            .putLong("session_created_at_epoch_ms", System.currentTimeMillis())
            .apply()
        val freshManager = buildSessionManager(prefs)

        val state = freshManager.authState.value
        assertThat(state).isInstanceOf(AuthState.Authenticated::class.java)
        assertThat((state as AuthState.Authenticated).phoneLastFour).isNull()
    }

    @Test
    public fun `saveSession with email provider — round-trips email and displayName`(): Unit =
        runTest {
            val user = firebaseUser("uid-email", email = "user@example.com", displayName = "Alice")
            every { firebaseAuth.currentUser } returns user

            sessionManager.saveSession(
                user = user,
                email = "user@example.com",
                displayName = "Alice",
                authProvider = AuthProvider.Email,
            )
            val state = sessionManager.authState.value as AuthState.Authenticated
            assertThat(state.uid).isEqualTo("uid-email")
            assertThat(state.email).isEqualTo("user@example.com")
            assertThat(state.displayName).isEqualTo("Alice")
            assertThat(state.authProvider).isEqualTo(AuthProvider.Email)
        }

    @Test
    public fun `saveSession with Google provider — round-trips displayName`(): Unit =
        runTest {
            val user = firebaseUser("uid-google", email = "alice@gmail.com", displayName = "Alice G")
            every { firebaseAuth.currentUser } returns user

            sessionManager.saveSession(
                user = user,
                email = "alice@gmail.com",
                displayName = "Alice G",
                authProvider = AuthProvider.Google,
            )
            val state = sessionManager.authState.value as AuthState.Authenticated
            assertThat(state.authProvider).isEqualTo(AuthProvider.Google)
            assertThat(state.displayName).isEqualTo("Alice G")
        }

    @Test
    public fun `old session missing new keys — defaults to Phone provider and null email`() {
        every { firebaseAuth.currentUser } returns firebaseUser("old-uid")
        // Write a session without the new keys (simulates pre-E02-S05 data)
        prefs
            .edit()
            .putString("uid", "old-uid")
            .putLong("session_created_at_epoch_ms", System.currentTimeMillis())
            .apply()
        // Create fresh SessionManager to trigger readInitialState()
        val freshSut = buildSessionManager(prefs)
        val state = freshSut.authState.value as AuthState.Authenticated
        assertThat(state.authProvider).isEqualTo(AuthProvider.Phone)
        assertThat(state.email).isNull()
        assertThat(state.displayName).isNull()
    }

    @Test
    public fun `updateDisplayName preserves current session fields`(): Unit =
        runTest {
            val user = firebaseUser("uid-email", email = "user@example.com", displayName = "Old Name")
            every { firebaseAuth.currentUser } returns user

            sessionManager.saveSession(
                user = user,
                phoneLastFour = "4321",
                email = "user@example.com",
                displayName = "Old Name",
                authProvider = AuthProvider.Email,
            )

            sessionManager.updateDisplayName("  New Name  ")

            val state = sessionManager.authState.value as AuthState.Authenticated
            assertThat(state.uid).isEqualTo("uid-email")
            assertThat(state.phoneLastFour).isEqualTo("4321")
            assertThat(state.email).isEqualTo("user@example.com")
            assertThat(state.displayName).isEqualTo("New Name")
            assertThat(state.authProvider).isEqualTo(AuthProvider.Email)
            assertThat(prefs.getString("display_name", null)).isEqualTo("New Name")
        }
}
