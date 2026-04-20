package com.homeservices.technician.domain.auth

import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.domain.auth.model.AuthResult
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class SaveSessionUseCase
    @Inject
    constructor(
        private val sessionManager: SessionManager,
        private val firebaseAuth: FirebaseAuth,
    ) {
        private companion object {
            const val PHONE_LAST_DIGITS = 4
        }

        public suspend fun save(
            user: FirebaseUser,
            phoneLastFour: String,
        ) {
            sessionManager.saveSession(user.uid, phoneLastFour)
        }

        /**
         * Truecaller pilot path: signs in anonymously to Firebase, stores uid + last 4 digits.
         * Phase 2 replaces this with Firebase custom-token flow. See ADR-0005.
         */
        public suspend fun saveAnonymousWithPhone(phoneNumber: String): AuthResult {
            return try {
                val result = firebaseAuth.signInAnonymously().await()
                val user =
                    result.user ?: return AuthResult.Error.General(
                        IllegalStateException("null user after anonymous sign-in"),
                    )
                val lastFour = phoneNumber.takeLast(PHONE_LAST_DIGITS)
                sessionManager.saveSession(user.uid, lastFour)
                AuthResult.Success(user)
            } catch (e: FirebaseException) {
                AuthResult.Error.General(e)
            }
        }
    }
