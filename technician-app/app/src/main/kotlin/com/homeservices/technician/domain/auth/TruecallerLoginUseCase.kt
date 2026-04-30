package com.homeservices.technician.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.homeservices.technician.domain.auth.model.TruecallerAuthResult
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

        @Suppress("SwallowedException", "TooGenericExceptionCaught")
        public fun init(context: Context) {
            try {
                TruecallerSDK.getInstance()
            } catch (e: Exception) {
                try {
                    val scope =
                        TruecallerSdkScope
                            .Builder(context, sdkCallback)
                            .sdkOptions(TruecallerSdkScope.SDK_OPTION_WITHOUT_OTP)
                            .build()
                    TruecallerSDK.init(scope)
                } catch (initEx: Exception) {
                    // No Truecaller Partner clientId — degrades to OTP-only auth.
                }
            }
        }

        @Suppress("SwallowedException", "TooGenericExceptionCaught")
        public fun isAvailable(): Boolean =
            try {
                TruecallerSDK.getInstance().isUsable
            } catch (e: Exception) {
                false
            }

        @Suppress("TooGenericExceptionCaught")
        public fun launch(activity: FragmentActivity) {
            try {
                TruecallerSDK.getInstance().getUserProfile(activity)
            } catch (e: Exception) {
                _resultFlow.tryEmit(TruecallerAuthResult.Cancelled)
            }
        }

        internal fun simulateSdkCallback(block: (ITrueCallback) -> Unit) {
            block(sdkCallback)
        }
    }
