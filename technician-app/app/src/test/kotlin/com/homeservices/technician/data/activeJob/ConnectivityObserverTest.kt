package com.homeservices.technician.data.activeJob

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ConnectivityObserverTest {
    private lateinit var context: Context
    private lateinit var connectivityManager: ConnectivityManager
    private lateinit var observer: ConnectivityObserver

    private val callbackSlot = slot<ConnectivityManager.NetworkCallback>()

    @BeforeEach
    public fun setUp() {
        context = mockk()
        connectivityManager = mockk(relaxed = true)
        every { context.getSystemService(Context.CONNECTIVITY_SERVICE) } returns connectivityManager
        every {
            connectivityManager.registerNetworkCallback(
                any<NetworkRequest>(),
                capture(callbackSlot),
            )
        } returns Unit
        observer = ConnectivityObserver(context)
    }

    @Test
    public fun `onAvailable callback emits true on isAvailable flow`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            var emitted: Boolean? = null
            val job =
                launch {
                    observer.isAvailable.first { it }.also { emitted = it }
                }

            // Trigger the callback after collection starts
            callbackSlot.captured.onAvailable(mockk<Network>())

            assertThat(emitted).isTrue()
            job.cancel()
        }

    @Test
    public fun `onLost callback emits false on isAvailable flow`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            var emitted: Boolean? = null
            val job =
                launch {
                    observer.isAvailable.first { !it }.also { emitted = it }
                }

            callbackSlot.captured.onLost(mockk<Network>())

            assertThat(emitted).isFalse()
            job.cancel()
        }

    @Test
    public fun `isConnected property returns the same flow as isAvailable`() {
        // Both properties expose the same underlying Flow object (isConnected = isAvailable).
        // Verified by checking they produce the same value on onAvailable.
        assertThat(observer.isConnected === observer.isAvailable).isTrue()
    }

    @Test
    public fun `unregisters network callback when flow is cancelled`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val collectJob = launch { observer.isAvailable.collect {} }
            collectJob.cancel()

            verify(atLeast = 1) {
                connectivityManager.unregisterNetworkCallback(any<ConnectivityManager.NetworkCallback>())
            }
        }
}
