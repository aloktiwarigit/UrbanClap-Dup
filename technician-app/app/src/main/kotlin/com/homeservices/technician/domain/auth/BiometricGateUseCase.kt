package com.homeservices.technician.domain.auth

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.homeservices.technician.domain.auth.model.BiometricResult
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import kotlin.coroutines.resume

public class BiometricGateUseCase
    @Inject
    constructor() {
        public fun canUseBiometric(context: Context): Boolean =
            BiometricManager
                .from(context)
                .canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL) ==
                BiometricManager.BIOMETRIC_SUCCESS

        /**
         * Shows a biometric prompt and suspends until the user authenticates, cancels, or an error
         * occurs. Caller should check [canUseBiometric] first — if false, skip this call entirely.
         *
         * Usage in future ViewModels:
         * ```
         * if (biometricGate.canUseBiometric(context)) {
         *     val result = biometricGate.requestAuth(activity, "Confirm Booking", "Use biometric")
         *     if (result !is BiometricResult.Authenticated) return
         * }
         * // proceed with sensitive action
         * ```
         */
        public suspend fun requestAuth(
            activity: FragmentActivity,
            title: String,
            subtitle: String,
        ): BiometricResult =
            suspendCancellableCoroutine { continuation ->
                val executor = ContextCompat.getMainExecutor(activity)

                val callback =
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                            if (continuation.isActive) continuation.resume(BiometricResult.Authenticated)
                        }

                        override fun onAuthenticationError(
                            errorCode: Int,
                            errString: CharSequence,
                        ) {
                            if (!continuation.isActive) return
                            val mapped =
                                when (errorCode) {
                                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> BiometricResult.Lockout
                                    BiometricPrompt.ERROR_HW_NOT_PRESENT,
                                    BiometricPrompt.ERROR_HW_UNAVAILABLE,
                                    BiometricPrompt.ERROR_NO_BIOMETRICS,
                                    BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL,
                                    -> BiometricResult.HardwareAbsent
                                    else -> BiometricResult.Cancelled
                                }
                            continuation.resume(mapped)
                        }

                        override fun onAuthenticationFailed() = Unit
                    }

                val promptInfo =
                    BiometricPrompt.PromptInfo
                        .Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle)
                        .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
                        .build()

                val prompt = BiometricPrompt(activity, executor, callback)
                prompt.authenticate(promptInfo)

                continuation.invokeOnCancellation { prompt.cancelAuthentication() }
            }
    }
