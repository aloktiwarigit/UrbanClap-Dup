package com.homeservices.technician.data.fcm

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.Instant
import javax.inject.Inject

@AndroidEntryPoint
public class HomeservicesFcmService : FirebaseMessagingService() {
    @Inject
    public lateinit var eventBus: JobOfferEventBus

    @Inject
    public lateinit var fcmTokenSyncUseCase: FcmTokenSyncUseCase

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onMessageReceived(message: RemoteMessage): Unit {
        val data = message.data
        if (data["type"] != "JOB_OFFER") return

        val offer = parseJobOffer(data) ?: return
        eventBus.tryEmit(offer)
    }

    override fun onNewToken(token: String): Unit {
        serviceScope.launch {
            fcmTokenSyncUseCase.invokeWithFcmToken(token)
        }
    }

    public override fun onDestroy(): Unit {
        super.onDestroy()
        serviceScope.cancel()
    }

    private fun parseJobOffer(data: Map<String, String>): JobOffer? {
        return try {
            val expiresAtMs = Instant.parse(data["expiresAt"] ?: return null).toEpochMilli()
            JobOffer(
                bookingId = data["bookingId"] ?: return null,
                serviceId = data["serviceId"] ?: return null,
                serviceName = data["serviceName"] ?: return null,
                addressText = data["addressText"] ?: return null,
                slotDate = data["slotDate"] ?: return null,
                slotWindow = data["slotWindow"] ?: return null,
                amountPaise = data["amount"]?.toLongOrNull() ?: return null,
                distanceKm = data["distanceKm"]?.toDoubleOrNull() ?: return null,
                expiresAtMs = expiresAtMs,
            )
        } catch (_: Exception) {
            null
        }
    }
}
