package com.homeservices.customer

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.di.BuildInfoProvider
import com.homeservices.customer.domain.booking.model.PaymentResult
import com.homeservices.customer.navigation.AppNavigation
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener
import com.truecaller.android.sdk.legacy.TruecallerSDK
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class MainActivity : FragmentActivity(), PaymentResultWithDataListener {
    @Inject public lateinit var buildInfo: BuildInfoProvider

    @Inject public lateinit var sessionManager: SessionManager

    @Inject public lateinit var paymentResultBus: PaymentResultBus

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HomeservicesTheme {
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                )
            }
        }
    }

    override fun onPaymentSuccess(razorpayPaymentId: String, paymentData: PaymentData?) {
        paymentResultBus.post(
            PaymentResult.Success(
                paymentId = razorpayPaymentId,
                orderId = paymentData?.orderId ?: "",
                signature = paymentData?.signature ?: "",
            ),
        )
    }

    override fun onPaymentError(code: Int, description: String?, paymentData: PaymentData?) {
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
