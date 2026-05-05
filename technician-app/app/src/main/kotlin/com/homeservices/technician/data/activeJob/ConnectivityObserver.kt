package com.homeservices.technician.data.activeJob

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class ConnectivityObserver
    @Inject
    internal constructor(
        @ApplicationContext private val context: Context,
    ) {
        /** Emits `true` on network available, `false` on lost. De-duplicates consecutive identical values. */
        public val isAvailable: Flow<Boolean> =
            callbackFlow {
                val manager =
                    context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                val callback =
                    object : ConnectivityManager.NetworkCallback() {
                        override fun onAvailable(network: Network) {
                            trySend(true)
                        }

                        override fun onLost(network: Network) {
                            trySend(false)
                        }
                    }
                val request =
                    NetworkRequest
                        .Builder()
                        .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                        .build()
                manager.registerNetworkCallback(request, callback)
                awaitClose { manager.unregisterNetworkCallback(callback) }
            }.distinctUntilChanged()

        /** Alias kept for backward-compatibility with callers using the old name. */
        public val isConnected: Flow<Boolean> get() = isAvailable
    }
