package com.homeservices.technician.ui.jobOffer

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.addCallback
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.ui.Modifier
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.homeservices.designsystem.theme.TechnicianHomeservicesTheme
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
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

    private val viewModel: JobOfferViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // SAFE-JOB-002: fail closed on a malformed payload. offerFromIntent returns null when any
        // extra is missing; previously setContent ran anyway, leaving Idle rendered as a dead
        // full-screen page over the lock screen with no way out.
        if (!shouldRenderOffer(offerFromIntent(intent))) {
            finish()
            return
        }
        emitIntentOffer(intent)

        // SAFE-JOB-003: system back must resolve the offer, not silently discard it. decline()
        // no-ops unless the state is Offering, so this cannot double-resolve an already-settled
        // offer; the state observer below then finishes the Activity.
        onBackPressedDispatcher.addCallback(this) {
            viewModel.decline()
        }

        // SAFE-JOB-001: observe terminal states and finish. The Activity previously called
        // setContent once and never observed the ViewModel, so Accept / Decline / Expiry all left
        // the technician stranded on a static message over the lock screen.
        // JobOfferScreen resolves its ViewModel via hiltViewModel(), which uses this Activity's
        // ViewModelStore — so `by viewModels()` is the same instance the UI drives.
        // CREATED, not STARTED (Codex review MAJOR-2). The ViewModel calls scheduleReset(2_000L)
        // after every terminal state, flipping it back to Idle two seconds later. Collecting only
        // while STARTED means a terminal state emitted while the Activity is stopped — a call, a
        // system overlay, a keyguard transition — is missed entirely, and on restart the collector
        // sees only Idle and never finishes. That would strand the technician over the lock screen
        // again, which is the exact defect this change exists to fix. CREATED keeps collecting for
        // the whole lifetime, and finish() from a stopped Activity is legal.
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.CREATED) {
                viewModel.uiState.collect { state ->
                    if (shouldFinishForState(state) && !isFinishing) finish()
                }
            }
        }

        setContent {
            TechnicianHomeservicesTheme {
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

/**
 * SAFE-JOB-001 — whether [state] is terminal and the lock-screen Activity should finish.
 *
 * `Idle` deliberately does NOT finish: the offer may still be arriving over the event bus when the
 * Activity first composes. Only an offer that has actually resolved closes the screen.
 */
internal fun shouldFinishForState(state: JobOfferUiState): Boolean =
    when (state) {
        is JobOfferUiState.Accepted,
        JobOfferUiState.Declined,
        JobOfferUiState.Expired,
        -> true

        JobOfferUiState.Idle,
        is JobOfferUiState.Offering,
        -> false
    }

/**
 * SAFE-JOB-002 — whether there is a usable offer to render. A null offer means the FCM payload was
 * malformed, and the Activity must fail closed rather than present an empty lock-screen takeover.
 */
internal fun shouldRenderOffer(offer: JobOffer?): Boolean = offer != null
