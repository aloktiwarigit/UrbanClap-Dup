package com.homeservices.technician.ui.jobOffer

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.ui.Modifier
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

/**
 * Full-screen Activity shown when a JOB_OFFER FCM arrives while the device is locked.
 * Declared with showWhenLocked + turnScreenOn in the manifest so it surfaces over
 * the lock screen without requiring the user to unlock first.
 *
 * Wraps the existing [JobOfferScreen] composable so all accept/decline logic
 * is shared with the in-app flow.
 */
@AndroidEntryPoint
public class JobOfferFullScreenActivity : ComponentActivity() {
    @Inject
    public lateinit var eventBus: JobOfferEventBus

    public companion object {
        private const val EXTRA_BOOKING_ID = "bookingId"
        private const val EXTRA_SERVICE_ID = "serviceId"
        private const val EXTRA_SERVICE_NAME = "serviceName"
        private const val EXTRA_ADDRESS_TEXT = "addressText"
        private const val EXTRA_SLOT_DATE = "slotDate"
        private const val EXTRA_SLOT_WINDOW = "slotWindow"
        private const val EXTRA_AMOUNT_PAISE = "amountPaise"
        private const val EXTRA_DISTANCE_KM = "distanceKm"
        private const val EXTRA_EXPIRES_AT_MS = "expiresAtMs"
        private const val EXTRA_SERVER_CLOCK_OFFSET_MS = "serverClockOffsetMs"
        private val offerActivityFlags: Int =
            Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP

        public fun intentFor(
            context: Context,
            offer: JobOffer,
        ): Intent =
            Intent(context, JobOfferFullScreenActivity::class.java)
                .addFlags(offerActivityFlags)
                .putExtra(EXTRA_BOOKING_ID, offer.bookingId)
                .putExtra(EXTRA_SERVICE_ID, offer.serviceId)
                .putExtra(EXTRA_SERVICE_NAME, offer.serviceName)
                .putExtra(EXTRA_ADDRESS_TEXT, offer.addressText)
                .putExtra(EXTRA_SLOT_DATE, offer.slotDate)
                .putExtra(EXTRA_SLOT_WINDOW, offer.slotWindow)
                .putExtra(EXTRA_AMOUNT_PAISE, offer.amountPaise)
                .putExtra(EXTRA_DISTANCE_KM, offer.distanceKm)
                .putExtra(EXTRA_EXPIRES_AT_MS, offer.expiresAtMs)
                .putExtra(EXTRA_SERVER_CLOCK_OFFSET_MS, offer.serverClockOffsetMs)

        @Suppress("ComplexCondition")
        internal fun offerFromIntent(intent: Intent): JobOffer? {
            val amount = intent.getLongExtra(EXTRA_AMOUNT_PAISE, Long.MIN_VALUE)
            val distance = intent.getDoubleExtra(EXTRA_DISTANCE_KM, Double.NaN)
            val expiresAt = intent.getLongExtra(EXTRA_EXPIRES_AT_MS, Long.MIN_VALUE)
            val serverClockOffsetMs = intent.getLongExtra(EXTRA_SERVER_CLOCK_OFFSET_MS, 0L)
            val bookingId = intent.getStringExtra(EXTRA_BOOKING_ID)
            val serviceId = intent.getStringExtra(EXTRA_SERVICE_ID)
            val serviceName = intent.getStringExtra(EXTRA_SERVICE_NAME)
            val addressText = intent.getStringExtra(EXTRA_ADDRESS_TEXT)
            val slotDate = intent.getStringExtra(EXTRA_SLOT_DATE)
            val slotWindow = intent.getStringExtra(EXTRA_SLOT_WINDOW)
            if (amount == Long.MIN_VALUE ||
                distance.isNaN() ||
                expiresAt == Long.MIN_VALUE ||
                bookingId == null ||
                serviceId == null ||
                serviceName == null ||
                addressText == null ||
                slotDate == null ||
                slotWindow == null
            ) {
                return null
            }
            return JobOffer(
                bookingId = bookingId,
                serviceId = serviceId,
                serviceName = serviceName,
                addressText = addressText,
                slotDate = slotDate,
                slotWindow = slotWindow,
                amountPaise = amount,
                distanceKm = distance,
                expiresAtMs = expiresAt,
                serverClockOffsetMs = serverClockOffsetMs,
            )
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        emitIntentOffer(intent)
        setContent {
            HomeservicesTheme {
                JobOfferScreen(modifier = Modifier.navigationBarsPadding())
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        emitIntentOffer(intent)
    }

    private fun emitIntentOffer(intent: Intent?): Unit {
        intent?.let(::offerFromIntent)?.let(eventBus::tryEmit)
    }
}
