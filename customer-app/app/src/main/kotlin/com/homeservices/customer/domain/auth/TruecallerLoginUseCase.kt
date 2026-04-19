package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import com.truecaller.android.sdk.common.models.TrueProfile
import com.truecaller.android.sdk.legacy.ITrueCallback
import com.truecaller.android.sdk.legacy.TrueError
import com.truecaller.android.sdk.legacy.TruecallerSDK
import com.truecaller.android.sdk.legacy.TruecallerSdkScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class TruecallerLoginUseCase
    @Inject
    constructor() {
        private val _resultFlow = MutableSharedFlow<TruecallerAuthResult>(replay = 1)
        public val resultFlow: SharedFlow<TruecallerAuthResult> = _resultFlow.asSharedFlow()

        internal val sdkCallback: ITrueCallback =
            object : ITrueCallback {
                override fun onSuccessProfileShared(profile: TrueProfile) {
                    _resultFlow.tryEmit(TruecallerAuthResult.Success(profile.phoneNumber.takeLast(4)))
                }

                override fun onFailureProfileShared(error: TrueError) {
                    _resultFlow.tryEmit(TruecallerAuthResult.Failure(error.errorType))
                }

                override fun onVerificationRequired(error: TrueError?) {
                    _resultFlow.tryEmit(TruecallerAuthResult.Cancelled)
                }
            }

        // TruecallerSDK.getInstance() throws IllegalStateException if not yet initialised —
        // that is the expected signal to call init(). Exception is not lost; it drives the init path.
        @Suppress("SwallowedException")
        public fun init(context: Context) {
            try {
                TruecallerSDK.getInstance()
            } catch (e: IllegalStateException) {
                val scope =
                    TruecallerSdkScope
                        .Builder(context, sdkCallback)
                        .sdkOptions(TruecallerSdkScope.SDK_OPTION_WITHOUT_OTP)
                        .build()
                TruecallerSDK.init(scope)
            }
        }

        // TruecallerSDK.getInstance() throws if SDK not yet initialised — graceful degradation to OTP.
        @Suppress("SwallowedException")
        public fun isAvailable(): Boolean =
            try {
                TruecallerSDK.getInstance().isUsable
            } catch (e: IllegalStateException) {
                false
            }

        public fun launch(activity: FragmentActivity) {
            TruecallerSDK.getInstance().getUserProfile(activity)
        }

        internal fun simulateSdkCallback(block: (ITrueCallback) -> Unit) {
            block(sdkCallback)
        }
    }
