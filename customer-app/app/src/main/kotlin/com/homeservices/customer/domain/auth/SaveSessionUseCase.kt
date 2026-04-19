package com.homeservices.customer.domain.auth

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthResult
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.concurrent.Executor
import javax.inject.Inject
import kotlin.coroutines.resume

public class SaveSessionUseCase @Inject constructor(
    private val sessionManager: SessionManager,
    private val firebaseAuth: FirebaseAuth,
    /** Executor for Firebase task callbacks. Defaults to direct (inline) execution. */
    private val callbackExecutor: Executor = Executor { it.run() },
) {
    public suspend fun save(user: FirebaseUser, phoneLastFour: String) {
        sessionManager.saveSession(user.uid, phoneLastFour)
    }

    /**
     * Truecaller pilot path: signs in anonymously to Firebase, stores uid + last 4 digits.
     * Phase 2 replaces this with Firebase custom-token flow. See ADR-0005.
     */
    internal suspend fun saveAnonymousWithPhone(phoneNumber: String): AuthResult =
        suspendCancellableCoroutine { cont ->
            firebaseAuth.signInAnonymously()
                .addOnSuccessListener(callbackExecutor) { result ->
                    val user = result.user
                    if (user != null) {
                        val lastFour = phoneNumber.takeLast(4)
                        // Launch a new coroutine for the suspend call to sessionManager
                        // but resume immediately since sessionManager.saveSession is
                        // just a shared prefs write under the hood
                        cont.resume(AuthResult.Success(user))
                    } else {
                        cont.resume(
                            AuthResult.Error.General(
                                IllegalStateException("null user after anonymous sign-in"),
                            ),
                        )
                    }
                }
                .addOnFailureListener(callbackExecutor) { e ->
                    cont.resume(AuthResult.Error.General(e))
                }
        }.also { result ->
            if (result is AuthResult.Success) {
                val lastFour = phoneNumber.takeLast(4)
                sessionManager.saveSession(result.user.uid, lastFour)
            }
        }
}
