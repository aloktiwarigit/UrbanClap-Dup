package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class AuthOrchestrator @Inject constructor(
    private val truecallerUseCase: TruecallerLoginUseCase,
    private val firebaseOtpUseCase: FirebaseOtpUseCase,
    private val saveSessionUseCase: SaveSessionUseCase,
) {
    public sealed class StartResult {
        public data object TruecallerLaunched : StartResult()
        public data object FallbackToOtp : StartResult()
    }

    public fun start(context: Context, activity: FragmentActivity): StartResult {
        truecallerUseCase.init(context)
        return if (truecallerUseCase.isAvailable()) {
            truecallerUseCase.launch(activity)
            StartResult.TruecallerLaunched
        } else {
            StartResult.FallbackToOtp
        }
    }

    public fun observeTruecallerResults(): SharedFlow<TruecallerAuthResult> =
        truecallerUseCase.resultFlow

    public fun sendOtp(
        phoneNumber: String,
        activity: FragmentActivity,
        resendToken: com.google.firebase.auth.PhoneAuthProvider.ForceResendingToken? = null,
    ): Flow<OtpSendResult> = firebaseOtpUseCase.sendOtp(phoneNumber, activity, resendToken)

    public fun verifyOtp(verificationId: String, code: String): Flow<AuthResult> =
        firebaseOtpUseCase.verifyOtp(verificationId, code)

    public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> =
        firebaseOtpUseCase.signInWithCredential(credential)

    public suspend fun completeWithTruecaller(phoneNumber: String): AuthResult =
        saveSessionUseCase.saveAnonymousWithPhone(phoneNumber)

    public suspend fun completeWithFirebase(user: FirebaseUser, phoneLastFour: String) {
        saveSessionUseCase.save(user, phoneLastFour)
    }
}
