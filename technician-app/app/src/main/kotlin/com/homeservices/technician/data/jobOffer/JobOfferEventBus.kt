package com.homeservices.technician.data.jobOffer

import com.homeservices.technician.domain.jobOffer.model.JobOffer
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class JobOfferEventBus @Inject constructor() {
    private val _events: MutableSharedFlow<JobOffer> = MutableSharedFlow(
        replay = 0,
        extraBufferCapacity = 1,
    )
    public val events: SharedFlow<JobOffer> = _events.asSharedFlow()

    public fun tryEmit(offer: JobOffer): Unit {
        _events.tryEmit(offer)
    }
}
