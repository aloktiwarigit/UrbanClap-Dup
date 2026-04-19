package com.homeservices.customer.domain.auth

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthResult
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class SaveSessionUseCase @Inject constructor(
    private val sessionManager: SessionManager,
    private val firebaseAuth: FirebaseAuth,
) {
    public suspend fun save(user: FirebaseUser, phoneLastFour: String) {
        sessionManager.saveSession(user.uid, phoneLastFour)
    }

    /**
     * Truecaller pilot path: signs in anonymously to Firebase, stores uid + last 4 digits.
     * Phase 2 replaces this with Firebase custom-token flow. See ADR-0005.
     */
    public suspend fun saveAnonymousWithPhone(phoneNumber: String): AuthResult {
        return try {
            val result = firebaseAuth.signInAnonymously().await()
            val user = result.user ?: return AuthResult.Error.General(
                IllegalStateException("null user after anonymous sign-in"),
            )
            val lastFour = phoneNumber.takeLast(4)
            sessionManager.saveSession(user.uid, lastFour)
            AuthResult.Success(user)
        } catch (e: Exception) {
            AuthResult.Error.General(e)
        }
    }
}
