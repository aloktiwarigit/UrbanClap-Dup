package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.NoCredentialException
import androidx.fragment.app.FragmentActivity
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.GoogleAuthProvider
import com.homeservices.customer.domain.auth.model.GoogleSignInResult
import dagger.hilt.android.qualifiers.ApplicationContext
import java.security.SecureRandom
import java.util.Base64
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class GoogleSignInUseCase
    @Inject
    constructor(
        private val credentialManager: CredentialManager,
        @ApplicationContext private val context: Context,
    ) {
        @Suppress("TooGenericExceptionCaught")
        public suspend fun getCredential(activity: FragmentActivity): GoogleSignInResult =
            try {
                val nonce = generateNonce()
                val googleIdOption =
                    GetGoogleIdOption
                        .Builder()
                        .setFilterByAuthorizedAccounts(false)
                        .setServerClientId(context.getString(com.homeservices.customer.R.string.default_web_client_id))
                        .setNonce(nonce)
                        .build()
                val request =
                    GetCredentialRequest
                        .Builder()
                        .addCredentialOption(googleIdOption)
                        .build()
                val response = credentialManager.getCredential(context = activity, request = request)
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(response.credential.data)
                val firebaseCredential = GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)
                GoogleSignInResult.CredentialObtained(firebaseCredential)
            } catch (e: GetCredentialCancellationException) {
                GoogleSignInResult.Cancelled
            } catch (e: NoCredentialException) {
                GoogleSignInResult.Unavailable
            } catch (e: Exception) {
                GoogleSignInResult.Error(e)
            }

        private fun generateNonce(): String {
            val bytes = ByteArray(16)
            SecureRandom().nextBytes(bytes)
            return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
        }
    }
