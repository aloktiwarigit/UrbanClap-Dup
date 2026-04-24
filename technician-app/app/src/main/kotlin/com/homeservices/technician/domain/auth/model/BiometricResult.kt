package com.homeservices.technician.domain.auth.model

public sealed class BiometricResult {
    public data object Authenticated : BiometricResult()

    public data object Cancelled : BiometricResult()

    public data object Lockout : BiometricResult()

    public data object HardwareAbsent : BiometricResult()
}
