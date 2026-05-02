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
            val state = sut.authState.value
            assertThat(state).isInstanceOf(AuthState.Authenticated::class.java)
            assertThat((state as AuthState.Authenticated).displayName).isEqualTo("Ramesh")
        }

    @Test
    public fun `signOut calls sessionManager clearSession`(): Unit =
        runTest(dispatcher) {
            sut.signOut()
            coVerify { sessionManager.clearSession() }
        }
}
