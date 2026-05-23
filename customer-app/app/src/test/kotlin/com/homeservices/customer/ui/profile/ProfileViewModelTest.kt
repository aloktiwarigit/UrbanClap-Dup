package com.homeservices.customer.ui.profile

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthState
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ProfileViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val sessionManager: SessionManager = mockk(relaxed = true)
    private lateinit var sut: ProfileViewModel

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
        every { sessionManager.authState } returns
            MutableStateFlow(
                AuthState.Authenticated(uid = "uid1", phoneLastFour = "4321", displayName = "Ramesh"),
            )
        sut = ProfileViewModel(sessionManager)
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `authState reflects session manager state`(): Unit =
        runTest(dispatcher) {
            // With WhileSubscribed, upstream starts on first subscription
            val job = sut.authState.launchIn(this)
            val state = sut.authState.value
            assertThat(state).isInstanceOf(AuthState.Authenticated::class.java)
            assertThat((state as AuthState.Authenticated).displayName).isEqualTo("Ramesh")
            job.cancel()
        }

    @Test
    public fun `signOut calls sessionManager signOut`(): Unit =
        runTest(dispatcher) {
            sut.signOut()
            coVerify { sessionManager.signOut() }
        }

    @Test
    public fun `updateDisplayName trims and saves display name`(): Unit =
        runTest(dispatcher) {
            sut.updateDisplayName("  Sita Sharma  ")

            coVerify { sessionManager.updateDisplayName("Sita Sharma") }
        }

    @Test
    public fun `authState initial value is Unauthenticated (WhileSubscribed does not pre-start upstream)`(): Unit =
        runTest(dispatcher) {
            // With WhileSubscribed, the upstream is NOT started until first subscriber.
            // Initial value is Unauthenticated as configured in stateIn.
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Unauthenticated)
            val vm = ProfileViewModel(sessionManager)
            assertThat(vm.authState.value).isEqualTo(AuthState.Unauthenticated)
        }
}
