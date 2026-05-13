package com.homeservices.customer

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.data.booking.PriceApprovalEventBus
import com.homeservices.customer.data.rating.RatingPromptEventBus
import com.homeservices.customer.di.BuildInfoProvider
import com.homeservices.customer.domain.booking.model.PaymentResult
import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
import com.homeservices.customer.navigation.AppNavigation
import com.homeservices.customer.navigation.CustomerRouteResolver
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener
import com.truecaller.android.sdk.legacy.TruecallerSDK
import dagger.hilt.android.AndroidEntryPoint
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

    @Inject public lateinit var priceApprovalEventBus: PriceApprovalEventBus

    @Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus

    @Inject public lateinit var isFirstLaunch: IsFirstLaunchUseCase

    /** Injected to support cold-start tier-ladder route resolution (E11-S01b-1). */
    @Inject public lateinit var routeResolver: CustomerRouteResolver

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }
        super.onCreate(savedInstanceState)

        // Extract cold-start deep-link URI before setContent.
        // homeservices://action/<TYPE>?entityId=<id> deep links from notification tray
        // are forwarded to AppNavigation for TierLadder-aware routing.
        val initialDeepLink: String? =
            intent?.data
                ?.takeIf { it.scheme == "homeservices" && it.host == "action" }
                ?.toString()

        setContent {
            HomeservicesTheme {
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                    priceApprovalEventBus = priceApprovalEventBus,
                    ratingPromptEventBus = ratingPromptEventBus,
                    isFirstLaunch = isFirstLaunch,
                    routeResolver = routeResolver,
                    initialDeepLink = initialDeepLink,
                )
            }
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
