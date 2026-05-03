package com.homeservices.technician.domain.auth

import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.homeservices.technician.domain.auth.model.AuthResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class EmailPasswordUseCase
    @Inject
    constructor(
        private val firebaseAuth: FirebaseAuth,
    ) {
        public fun signIn(
            email: String,
            password: String,
        ): Flow<AuthResult> =
            flow {
                emit(
                    try {
                        val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
                        AuthResult.Success(result.user!!)
                    } catch (e: FirebaseAuthInvalidCredentialsException) {
                        if (e.errorCode == "ERROR_INVALID_EMAIL") {
                            AuthResult.Error.InvalidEmail
                        } else {
                            AuthResult.Error.WrongCredential
                        }
                    } catch (e: FirebaseAuthInvalidUserException) {
                        AuthResult.Error.UserNotFound
                    } catch (e: FirebaseException) {
                        AuthResult.Error.General(e)
                    },
                )
            }

        public fun signUp(
            email: String,
            password: String,
        ): Flow<AuthResult> =
            flow {
                emit(
                    try {
                        val result = firebaseAuth.createUserWithEmailAndPassword(email, password).await()
                        AuthResult.Success(result.user!!)
                    } catch (e: FirebaseAuthUserCollisionException) {
                        AuthResult.Error.EmailAlreadyInUse
                    } catch (e: FirebaseAuthWeakPasswordException) {
                        AuthResult.Error.WeakPassword
                    } catch (e: FirebaseAuthInvalidCredentialsException) {
                        AuthResult.Error.InvalidEmail
                    } catch (e: FirebaseException) {
                        AuthResult.Error.General(e)
                    },
                )
            }

        @Suppress("TooGenericExceptionCaught")
        public fun sendPasswordReset(email: String): Flow<Result<Unit>> =
            flow {
                emit(
                    try {
                        firebaseAuth.sendPasswordResetEmail(email).await()
                        Result.success(Unit)
                    } catch (e: Exception) {
                        Result.failure(e)
                    },
                )
            }
    }
