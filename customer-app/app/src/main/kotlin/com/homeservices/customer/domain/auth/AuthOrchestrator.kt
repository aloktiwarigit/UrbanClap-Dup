package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.google.firebase.FirebaseException
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.GoogleSignInResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class AuthOrchestrator
    @Inject
    constructor(
        private val truecallerUseCase: TruecallerLoginUseCase,
        private val firebaseOtpUseCase: FirebaseOtpUseCase,
        private val saveSessionUseCase: SaveSessionUseCase,
        private val googleSignInUseCase: GoogleSignInUseCase,
        private val emailPasswordUseCase: EmailPasswordUseCase,
        private val firebaseAuth: FirebaseAuth,
    ) {
        public sealed class StartResult {
            public data object TruecallerLaunched : StartResult()

            public data object FallbackToOtp : StartResult()
        }

        public fun start(
            context: Context,
            activity: FragmentActivity,
        ): StartResult {
            truecallerUseCase.init(context)
            return if (truecallerUseCase.isAvailable()) {
                truecallerUseCase.launch(activity)
                StartResult.TruecallerLaunched
            } else {
                StartResult.FallbackToOtp
            }
        }

        public fun observeTruecallerResults(): SharedFlow<TruecallerAuthResult> = truecallerUseCase.resultFlow

        public fun sendOtp(
            phoneNumber: String,
            activity: FragmentActivity,
            resendToken: com.google.firebase.auth.PhoneAuthProvider.ForceResendingToken? = null,
        ): Flow<OtpSendResult> = firebaseOtpUseCase.sendOtp(phoneNumber, activity, resendToken)

        public fun verifyOtp(
            verificationId: String,
            code: String,
        ): Flow<AuthResult> = firebaseOtpUseCase.verifyOtp(verificationId, code)

        public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> =
            firebaseOtpUseCase.signInWithCredential(credential)

        public suspend fun completeWithTruecaller(phoneNumber: String): AuthResult = saveSessionUseCase.saveAnonymousWithPhone(phoneNumber)

        public suspend fun completeWithFirebase(
            user: FirebaseUser,
            phoneLastFour: String,
        ) {
            saveSessionUseCase.save(user, phoneLastFour)
        }

        // ── New for E02-S05-A ──────────────────────────────────────────────

        public fun startGoogleSignIn(activity: FragmentActivity): Flow<AuthResult> =
            flow {
                when (val credResult = googleSignInUseCase.getCredential(activity)) {
                    is GoogleSignInResult.CredentialObtained -> {
                        val authResult = linkOrSignIn(credResult.credential)
                        if (authResult is AuthResult.Success) {
                            saveSessionUseCase.saveWithGoogle(authResult.user)
                        }
                        emit(authResult)
                    }
                    GoogleSignInResult.Cancelled -> emit(AuthResult.Cancelled)
                    GoogleSignInResult.Unavailable -> emit(AuthResult.Unavailable)
                    is GoogleSignInResult.Error -> emit(AuthResult.Error.General(credResult.cause))
                }
            }

        public fun startEmailSignIn(
            email: String,
            password: String,
        ): Flow<AuthResult> =
            flow {
                emailPasswordUseCase.signIn(email, password).collect { result ->
                    if (result is AuthResult.Success) {
                        saveSessionUseCase.saveWithEmail(result.user)
                    }
                    emit(result)
                }
            }

        public fun startEmailSignUp(
            email: String,
            password: String,
        ): Flow<AuthResult> =
            flow {
                val currentUser = firebaseAuth.currentUser
                if (currentUser != null && currentUser.isAnonymous) {
                    emit(linkAnonymousToEmail(currentUser, email, password))
                } else {
                    emailPasswordUseCase.signUp(email, password).collect { result ->
                        if (result is AuthResult.Success) {
                            saveSessionUseCase.saveWithEmail(result.user)
                        }
                        emit(result)
                    }
                }
            }

        public fun sendPasswordReset(email: String): Flow<Result<Unit>> = emailPasswordUseCase.sendPasswordReset(email)

        @Suppress("TooGenericExceptionCaught")
        private suspend fun linkOrSignIn(credential: AuthCredential): AuthResult {
            val currentUser = firebaseAuth.currentUser
            return try {
                if (currentUser != null && currentUser.isAnonymous) {
                    val result = currentUser.linkWithCredential(credential).await()
                    AuthResult.Success(result.user!!)
                } else {
                    val result = firebaseAuth.signInWithCredential(credential).await()
                    AuthResult.Success(result.user!!)
                }
            } catch (e: FirebaseAuthUserCollisionException) {
                try {
                    val result = firebaseAuth.signInWithCredential(credential).await()
                    AuthResult.Success(result.user!!)
                } catch (e2: Exception) {
                    AuthResult.Error.General(e2)
                }
            } catch (e: FirebaseException) {
                AuthResult.Error.General(e)
            }
        }

        @Suppress("TooGenericExceptionCaught")
        private suspend fun linkAnonymousToEmail(
            anonymousUser: FirebaseUser,
            email: String,
            password: String,
        ): AuthResult =
            try {
                val emailCredential =
                    com.google.firebase.auth.EmailAuthProvider
                        .getCredential(email, password)
                val result = anonymousUser.linkWithCredential(emailCredential).await()
                val user = result.user!!
                user.sendEmailVerification().await()
                saveSessionUseCase.saveWithEmail(user)
                AuthResult.Success(user)
            } catch (e: FirebaseAuthUserCollisionException) {
                AuthResult.Error.EmailAlreadyInUse
            } catch (e: FirebaseAuthWeakPasswordException) {
                AuthResult.Error.WeakPassword
            } catch (e: FirebaseException) {
                AuthResult.Error.General(e)
            }
    }
