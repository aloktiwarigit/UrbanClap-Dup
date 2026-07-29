package com.homeservices.customer

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.data.pendingaction.PendingActionStore
import com.homeservices.customer.di.BuildInfoProvider
import com.homeservices.customer.domain.booking.model.PaymentResult
import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
import com.homeservices.customer.navigation.AppNavigation
import com.homeservices.customer.navigation.CustomerRouteResolver
import com.homeservices.designsystem.theme.CustomerHomeservicesTheme
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener
import com.truecaller.android.sdk.legacy.TruecallerSDK
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.MutableStateFlow
import javax.inject.Inject

/**
 * Entry-point Activity for the customer-app.
 *
 * E11-S01b-1 additions:
 *   - [CustomerRouteResolver] injected to support cold-start tier-ladder navigation.
 *     The resolver is passed to [AppNavigation] which reads [RouteContext] and calls
 *     [TierLadder.resolve] on first composition.
 *   - The cold-start deep-link URI (from the launching [Intent]) is extracted before
 *     [setContent] and forwarded to [AppNavigation] as [initialDeepLink].
 *   - POST_NOTIFICATIONS runtime permission flow is handled inside [AppNavigation]
 *     via [rememberLauncherForActivityResult] — see AppNavigation.kt.
 *   - [onNewIntent] override (E11-S01b-1 fix): PendingIntent uses
 *     FLAG_ACTIVITY_SINGLE_TOP | FLAG_ACTIVITY_CLEAR_TOP. Tapping a notification while
 *     MainActivity already exists routes the URI to onNewIntent, not a fresh onCreate.
 *     [deepLinkState] is a [MutableStateFlow] initialised from the cold-start URI;
 *     onNewIntent updates it so AppNavigation's collectAsState observer reacts without
 *     a full Activity recreation.
 *
 * AppNavigation composable signature is NOT changed — [routeResolver] and
 * [initialDeepLink] are added as new named parameters with defaults so
 * Stream 2.6 (Sentry breadcrumbs) can rebase without conflicts.
 */
@AndroidEntryPoint
public class MainActivity :
    AppCompatActivity(),
    PaymentResultWithDataListener {
    @Inject public lateinit var buildInfo: BuildInfoProvider

    @Inject public lateinit var sessionManager: SessionManager

    @Inject public lateinit var paymentResultBus: PaymentResultBus

    /**
     * E11-S01b-2: Injected to drive Room-based navigation in [AppNavigation].
     * Replaces the removed PriceApprovalEventBus + RatingPromptEventBus injection.
     */
    @Inject public lateinit var pendingActionStore: PendingActionStore

    @Inject public lateinit var isFirstLaunch: IsFirstLaunchUseCase

    @Inject public lateinit var isConsentRequired: IsConsentRequiredUseCase

    @Inject public lateinit var featureFlags: FeatureFlags

    /** Injected to support cold-start tier-ladder route resolution (E11-S01b-1). */
    @Inject public lateinit var routeResolver: CustomerRouteResolver

    /**
     * Observable deep-link state. Initialised from the cold-start Intent in [onCreate];
     * updated in [onNewIntent] when the Activity is warm-tapped via a single-top
     * PendingIntent. AppNavigation observes this via [collectAsState] so warm-tap
     * notifications navigate correctly without re-creating the Activity.
     */
    public val deepLinkState: MutableStateFlow<String?> = MutableStateFlow(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }
        super.onCreate(savedInstanceState)

        // Extract cold-start deep-link URI before setContent.
        // homeservices://action/<TYPE>?entityId=<id> deep links from notification tray
        // are forwarded to AppNavigation for TierLadder-aware routing.
        val coldStartDeepLink: String? =
            intent
                ?.data
                ?.takeIf { it.scheme == "homeservices" && it.host == "action" }
                ?.toString()
        deepLinkState.value = coldStartDeepLink

        setContent {
            CustomerHomeservicesTheme {
                // Observe deepLinkState so AppNavigation reacts to both cold-start and
                // warm-tap (onNewIntent) deep links.
                val currentDeepLink by deepLinkState.collectAsState()
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                    pendingActionStore = pendingActionStore,
                    isFirstLaunch = isFirstLaunch,
                    isConsentRequired = isConsentRequired,
                    featureFlags = featureFlags,
                    routeResolver = routeResolver,
                    initialDeepLink = currentDeepLink,
                )
            }
        }
    }

    /**
     * Called when a new Intent arrives for a single-top Activity instance.
     *
     * When [CustomerFirebaseMessagingService] creates a [PendingIntent] with
     * FLAG_ACTIVITY_SINGLE_TOP | FLAG_ACTIVITY_CLEAR_TOP, Android delivers the
     * notification tap here (not to [onCreate]) if MainActivity is already on the
     * back stack. Updating [deepLinkState] ensures AppNavigation navigates to the
     * correct screen without recomposing the entire tree.
     *
     * Non-homeservices:// URIs are ignored — they belong to other subsystems
     * (e.g. the DigiLocker callback handled in technician-app's MainActivity).
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Store the new intent so that subsequent getIntent() calls return it.
        setIntent(intent)
        val newDeepLink =
            intent.data
                ?.takeIf { it.scheme == "homeservices" && it.host == "action" }
                ?.toString()
        if (newDeepLink != null) {
            deepLinkState.value = newDeepLink
        }
    }

    override fun onPaymentSuccess(
        razorpayPaymentId: String,
        paymentData: PaymentData?,
    ) {
        paymentResultBus.post(
            PaymentResult.Success(
                paymentId = razorpayPaymentId,
                orderId = paymentData?.orderId ?: "",
                signature = paymentData?.signature ?: "",
            ),
        )
    }

    override fun onPaymentError(
        code: Int,
        description: String?,
        paymentData: PaymentData?,
    ) {
        paymentResultBus.post(
            PaymentResult.Failure(
                code = code,
                description = description ?: "Payment failed",
            ),
        )
    }

    /**
     * Truecaller SDK 3.x delivers the one-tap result via the legacy onActivityResult path.
     * @Suppress DEPRECATION because the SDK has not yet migrated to ActivityResultContracts.
     */
    @Suppress("DEPRECATION")
    override fun onActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == TruecallerSDK.SHARE_PROFILE_REQUEST_CODE) {
            TruecallerSDK.getInstance().onActivityResultObtained(
                this,
                requestCode,
                resultCode,
                data,
            )
        }
    }
}
