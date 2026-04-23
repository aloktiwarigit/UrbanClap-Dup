package com.homeservices.technician.domain.activeJob.model

public sealed class NavigationEvent {
    public data class Maps(
        val uri: String,
    ) : NavigationEvent()
}
