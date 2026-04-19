package com.homeservices.customer.domain.auth.model

internal sealed class BiometricResult {
    data object Authenticated : BiometricResult()
    data object Cancelled : BiometricResult()
    data object Lockout : BiometricResult()
    data object HardwareAbsent : BiometricResult()
}
