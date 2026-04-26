package com.homeservices.technician.data.earnings

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class EarningsUpdateEventBus @Inject constructor() {
    private val _events: MutableSharedFlow<Unit> =
        MutableSharedFlow(
            replay = 0,
            extraBufferCapacity = 1,
        )
    public val events: SharedFlow<Unit> = _events.asSharedFlow()

    @Suppress("ACCIDENTAL_OVERRIDE")
    public fun notify(): Unit {
        _events.tryEmit(Unit)
    }
}
