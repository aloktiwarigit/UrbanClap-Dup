package com.homeservices.customer.data.auth.di

import android.content.Context
import android.content.SharedPreferences
import androidx.credentials.CredentialManager
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.customer.data.auth.SessionInvalidator
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.auth.SessionPrefsMigrator
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.sentry.Sentry
import java.io.IOException
import java.security.GeneralSecurityException
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object AuthModule {
    @Provides
    @Singleton
    public fun provideFirebaseAuth(): FirebaseAuth = FirebaseAuth.getInstance()

    @Provides
    @Singleton
    public fun provideFirebaseMessaging(): FirebaseMessaging = FirebaseMessaging.getInstance()

    @Provides
    @Singleton
    public fun provideSessionInvalidator(sessionManager: SessionManager): SessionInvalidator = sessionManager

    @Provides
    @Singleton
    public fun provideCredentialManager(
        @ApplicationContext context: Context,
    ): CredentialManager = CredentialManager.create(context)

    @Provides
    @Singleton
    @AuthPrefs
    public fun provideAuthPrefs(
        @ApplicationContext context: Context,
    ): SharedPreferences {
        // SEC-03: MasterKey/EncryptedSharedPreferences setup can fail on Android 12+
        // devices with corrupt KeyStore or StrongBox provisioning issues. We catch
        // GeneralSecurityException and IOException here and fall back to a cleartext
        // SharedPreferences named "auth_session_fallback" (always empty on first use,
        // which forces re-login) instead of crashing Hilt at startup.
        return try {
            val masterKey =
                MasterKey
                    .Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build()
            val prefs =
                EncryptedSharedPreferences.create(
                    context,
                    "auth_session",
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
                )
            // Silently migrate any session data written by the deprecated MasterKeys API.
            // No-op if legacy key alias is absent (first install or already migrated).
            SessionPrefsMigrator.migrateIfNeeded(context, prefs, "auth_session")
            prefs
        } catch (e: GeneralSecurityException) {
            Sentry.addBreadcrumb(
                "AuthModule.provideAuthPrefs: MasterKey/EncryptedSharedPreferences " +
                    "GeneralSecurityException — falling back to cleartext prefs (forces re-login)",
            )
            Sentry.captureException(e)
            context.getSharedPreferences("auth_session_fallback", Context.MODE_PRIVATE)
        } catch (e: IOException) {
            Sentry.addBreadcrumb(
                "AuthModule.provideAuthPrefs: MasterKey/EncryptedSharedPreferences " +
                    "IOException — falling back to cleartext prefs (forces re-login)",
            )
            Sentry.captureException(e)
            context.getSharedPreferences("auth_session_fallback", Context.MODE_PRIVATE)
        }
    }
}
