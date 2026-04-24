OpenAI Codex v0.121.0 (research preview)
--------
workdir: C:\Alok\Business Projects\Urbanclap-dup
model: gpt-5.4
provider: openai
approval: never
sandbox: read-only
reasoning effort: none
reasoning summaries: none
session id: 019da70a-7183-78c2-86de-d80dcf84614a
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff 550d2dd8ab3d571ee16ef2338736a531ea96af9b' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 599ms:
diff --git a/.gitignore b/.gitignore
index d9805b1..9570a00 100644
--- a/.gitignore
+++ b/.gitignore
@@ -15,6 +15,9 @@
 *.p12
 service-account*.json
 google-services.json
+# Stub placeholder files with no real credentials are tracked; real files are excluded by the rule above
+!customer-app/app/google-services.json
+!technician-app/app/google-services.json
 GoogleService-Info.plist
 
 # === Node / Next.js ===
diff --git a/customer-app/app/build.gradle.kts b/customer-app/app/build.gradle.kts
index 3a14a27..f0670bc 100644
--- a/customer-app/app/build.gradle.kts
+++ b/customer-app/app/build.gradle.kts
@@ -11,6 +11,7 @@ plugins {
     alias(libs.plugins.paparazzi)
     alias(libs.plugins.kover)
     alias(libs.plugins.android.junit5)
+    alias(libs.plugins.google.services)
 }
 
 android {
@@ -43,6 +44,7 @@ android {
             isMinifyEnabled = false
         }
         release {
+            // TODO(deploy-story): enable minification before Play Store submission — skeleton intentionally disabled
             isMinifyEnabled = false
             proguardFiles(
                 getDefaultProguardFile("proguard-android-optimize.txt"),
@@ -132,7 +134,16 @@ kover {
         verify {
             rule {
                 minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.LINE)
-                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.BRANCH)
+                // Branch coverage threshold is intentionally lower than line/instruction because:
+                // 1. Compose UI files generate synthetic internal branches (recomposition guards,
+                //    slot-table ops) that are only exercisable via Compose instrumented tests,
+                //    not JVM unit tests. Paparazzi snapshot tests cover the UI rendering paths.
+                // 2. Firebase SDK callbackFlow bodies (PhoneAuthProvider callbacks) are framework
+                //    callbacks that require a live Firebase project to trigger.
+                // 3. Android BiometricPrompt callback branches require a real device/emulator.
+                // CI's Espresso/Compose instrumented tests (run in a later story) will cover
+                // the remaining UI and framework integration branches.
+                minBound(70, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.BRANCH)
                 minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.INSTRUCTION)
             }
         }
@@ -167,6 +178,24 @@ kover {
                     "*.TestRunner",
                     // Compose theme boilerplate (Color / Theme / Type) — framework wiring, not business logic
                     "*.ui.theme.*",
+                    // Compose navigation graphs — NavHost lambdas are framework wiring, not unit-testable
+                    "*.navigation.*",
+                    // Hilt DI module — @Provides methods are framework wiring
+                    "*.data.auth.di.*",
+                    // Stub home screen — placeholder Compose composable, no logic
+                    "*.ui.home.*",
+                    // BiometricGateUseCase.requestAuth requires FragmentActivity + BiometricPrompt
+                    // (Android OS framework calls), not unit-testable without instrumentation
+                    "*.BiometricGateUseCase",
+                    // Compose screen files generate *Kt JVM wrapper classes. The top-level class
+                    // contains Compose-framework branches (recomposition guards, slot-table ops)
+                    // that are only exercisable via Compose instrumented tests (Paparazzi covers
+                    // the nested $AuthScreen$1 lambda which holds the actual when-branches).
+                    "*.AuthScreenKt",
+                    // FirebaseOtpUseCase.sendOtp uses callbackFlow with PhoneAuthProvider —
+                    // a real Firebase SDK callback that can't be triggered in JVM unit tests.
+                    // signInWithCredential branches are tested separately.
+                    "*.FirebaseOtpUseCase",
                 )
             }
         }
@@ -203,6 +232,19 @@ dependencies {
 
     implementation(libs.sentry.android)
 
+    // Firebase (BOM manages all Firebase library versions)
+    implementation(platform(libs.firebase.bom))
+    implementation(libs.firebase.auth.ktx)
+
+    // Coroutines — play-services extensions (.await() on Task<T>)
+    implementation(libs.kotlinx.coroutines.play.services)
+
+    // Auth SDKs
+    implementation(libs.truecaller.sdk)
+    implementation(libs.androidx.security.crypto)
+    implementation(libs.androidx.biometric)
+    implementation(libs.androidx.navigation.compose)
+
     testImplementation(libs.junit.jupiter)
     testImplementation(libs.junit.jupiter.api)
     testRuntimeOnly(libs.junit.jupiter.engine)
@@ -213,6 +255,7 @@ dependencies {
     testImplementation(libs.robolectric)
     testImplementation(libs.androidx.test.core)
     testImplementation(libs.hilt.testing)
+    testImplementation(libs.kotlinx.coroutines.test)
     kspTest(libs.hilt.compiler)
 
     androidTestImplementation(libs.hilt.testing)
diff --git a/customer-app/app/google-services.json b/customer-app/app/google-services.json
new file mode 100644
index 0000000..6469c0f
--- /dev/null
+++ b/customer-app/app/google-services.json
@@ -0,0 +1,29 @@
+{
+  "project_info": {
+    "project_number": "000000000000",
+    "project_id": "homeservices-mvp-dev",
+    "storage_bucket": "homeservices-mvp-dev.appspot.com"
+  },
+  "client": [
+    {
+      "client_info": {
+        "mobilesdk_app_id": "1:000000000000:android:0000000000000000000000",
+        "android_client_info": {
+          "package_name": "com.homeservices.customer"
+        }
+      },
+      "oauth_client": [],
+      "api_key": [
+        {
+          "current_key": "PLACEHOLDER_REPLACE_WITH_REAL_KEY_FROM_FIREBASE_CONSOLE"
+        }
+      ],
+      "services": {
+        "appinvite_service": {
+          "other_platform_oauth_client": []
+        }
+      }
+    }
+  ],
+  "configuration_version": "1"
+}
diff --git a/customer-app/app/proguard-rules.pro b/customer-app/app/proguard-rules.pro
index 2d9779d..396521a 100644
--- a/customer-app/app/proguard-rules.pro
+++ b/customer-app/app/proguard-rules.pro
@@ -1 +1,9 @@
 # Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
+
+# Truecaller SDK — SDK classes use reflection; must not be renamed or removed
+-keep class com.truecaller.android.sdk.** { *; }
+-dontwarn com.truecaller.android.sdk.**
+
+# Firebase Auth — required for phone auth credential classes
+-keepattributes Signature
+-keepattributes *Annotation*
diff --git a/customer-app/app/src/main/AndroidManifest.xml b/customer-app/app/src/main/AndroidManifest.xml
index 26b6b17..be84d3f 100644
--- a/customer-app/app/src/main/AndroidManifest.xml
+++ b/customer-app/app/src/main/AndroidManifest.xml
@@ -3,6 +3,11 @@
 
     <uses-permission android:name="android.permission.INTERNET" />
 
+    <!-- Required for Truecaller SDK to detect whether Truecaller is installed -->
+    <queries>
+        <package android:name="com.truecaller" />
+    </queries>
+
     <application
         android:name=".HomeservicesCustomerApplication"
         android:allowBackup="false"
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt
index bfbc812..20306b5 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt
@@ -1,25 +1,53 @@
 package com.homeservices.customer
 
+import android.content.Intent
 import android.os.Bundle
-import androidx.activity.ComponentActivity
 import androidx.activity.compose.setContent
+import androidx.fragment.app.FragmentActivity
+import com.homeservices.customer.data.auth.SessionManager
 import com.homeservices.customer.di.BuildInfoProvider
-import com.homeservices.customer.ui.SmokeScreen
+import com.homeservices.customer.navigation.AppNavigation
 import com.homeservices.designsystem.theme.HomeservicesTheme
+import com.truecaller.android.sdk.legacy.TruecallerSDK
 import dagger.hilt.android.AndroidEntryPoint
 import javax.inject.Inject
 
 @AndroidEntryPoint
-public class MainActivity : ComponentActivity() {
-    @Inject
-    public lateinit var buildInfo: BuildInfoProvider
+public class MainActivity : FragmentActivity() {
+    @Inject public lateinit var buildInfo: BuildInfoProvider
+
+    @Inject public lateinit var sessionManager: SessionManager
 
     override fun onCreate(savedInstanceState: Bundle?) {
         super.onCreate(savedInstanceState)
         setContent {
             HomeservicesTheme {
-                SmokeScreen(buildInfo = buildInfo)
+                AppNavigation(
+                    sessionManager = sessionManager,
+                    activity = this,
+                )
             }
         }
     }
+
+    /**
+     * Truecaller SDK 3.x delivers the one-tap result via the legacy onActivityResult path.
+     * @Suppress DEPRECATION because the SDK has not yet migrated to ActivityResultContracts.
+     */
+    @Suppress("DEPRECATION")
+    override fun onActivityResult(
+        requestCode: Int,
+        resultCode: Int,
+        data: Intent?,
+    ) {
+        super.onActivityResult(requestCode, resultCode, data)
+        if (requestCode == TruecallerSDK.SHARE_PROFILE_REQUEST_CODE) {
+            TruecallerSDK.getInstance().onActivityResultObtained(
+                this,
+                requestCode,
+                resultCode,
+                data,
+            )
+        }
+    }
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionManager.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionManager.kt
new file mode 100644
index 0000000..a539a14
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionManager.kt
@@ -0,0 +1,70 @@
+package com.homeservices.customer.data.auth
+
+import android.content.SharedPreferences
+import com.homeservices.customer.data.auth.di.AuthPrefs
+import com.homeservices.customer.domain.auth.model.AuthState
+import kotlinx.coroutines.Dispatchers
+import kotlinx.coroutines.flow.MutableStateFlow
+import kotlinx.coroutines.flow.StateFlow
+import kotlinx.coroutines.flow.asStateFlow
+import kotlinx.coroutines.withContext
+import java.util.concurrent.TimeUnit
+import javax.inject.Inject
+import javax.inject.Singleton
+
+@Singleton
+public class SessionManager
+    @Inject
+    constructor(
+        @AuthPrefs private val prefs: SharedPreferences,
+    ) {
+        private companion object {
+            const val KEY_UID = "uid"
+            const val KEY_PHONE_LAST_FOUR = "phone_last_four"
+            const val KEY_SESSION_CREATED_AT = "session_created_at_epoch_ms"
+            val SESSION_TTL_MS = TimeUnit.DAYS.toMillis(180)
+        }
+
+        private val _authState = MutableStateFlow(readInitialState())
+        public val authState: StateFlow<AuthState> = _authState.asStateFlow()
+
+        private fun readInitialState(): AuthState {
+            val uid = prefs.getString(KEY_UID, null)
+            val createdAt = prefs.getLong(KEY_SESSION_CREATED_AT, 0L)
+            val sessionExpired =
+                uid == null ||
+                    createdAt == 0L ||
+                    System.currentTimeMillis() - createdAt > SESSION_TTL_MS
+            return if (sessionExpired) {
+                if (uid != null) clearPrefs()
+                AuthState.Unauthenticated
+            } else {
+                val phoneLastFour = prefs.getString(KEY_PHONE_LAST_FOUR, "") ?: ""
+                AuthState.Authenticated(uid = uid!!, phoneLastFour = phoneLastFour)
+            }
+        }
+
+        public suspend fun saveSession(
+            uid: String,
+            phoneLastFour: String,
+        ) {
+            withContext(Dispatchers.IO) {
+                prefs
+                    .edit()
+                    .putString(KEY_UID, uid)
+                    .putString(KEY_PHONE_LAST_FOUR, phoneLastFour)
+                    .putLong(KEY_SESSION_CREATED_AT, System.currentTimeMillis())
+                    .apply()
+            }
+            _authState.value = AuthState.Authenticated(uid = uid, phoneLastFour = phoneLastFour)
+        }
+
+        public suspend fun clearSession() {
+            withContext(Dispatchers.IO) { clearPrefs() }
+            _authState.value = AuthState.Unauthenticated
+        }
+
+        private fun clearPrefs() {
+            prefs.edit().clear().apply()
+        }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthModule.kt
new file mode 100644
index 0000000..4456850
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthModule.kt
@@ -0,0 +1,37 @@
+package com.homeservices.customer.data.auth.di
+
+import android.content.Context
+import android.content.SharedPreferences
+import androidx.security.crypto.EncryptedSharedPreferences
+import androidx.security.crypto.MasterKeys
+import com.google.firebase.auth.FirebaseAuth
+import dagger.Module
+import dagger.Provides
+import dagger.hilt.InstallIn
+import dagger.hilt.android.qualifiers.ApplicationContext
+import dagger.hilt.components.SingletonComponent
+import javax.inject.Singleton
+
+@Module
+@InstallIn(SingletonComponent::class)
+public object AuthModule {
+    @Provides
+    @Singleton
+    public fun provideFirebaseAuth(): FirebaseAuth = FirebaseAuth.getInstance()
+
+    @Provides
+    @Singleton
+    @AuthPrefs
+    public fun provideAuthPrefs(
+        @ApplicationContext context: Context,
+    ): SharedPreferences {
+        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
+        return EncryptedSharedPreferences.create(
+            "auth_session",
+            masterKeyAlias,
+            context,
+            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
+            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
+        )
+    }
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthPrefs.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthPrefs.kt
new file mode 100644
index 0000000..d8e8996
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthPrefs.kt
@@ -0,0 +1,7 @@
+package com.homeservices.customer.data.auth.di
+
+import javax.inject.Qualifier
+
+@Qualifier
+@Retention(AnnotationRetention.BINARY)
+public annotation class AuthPrefs
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/AuthOrchestrator.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/AuthOrchestrator.kt
new file mode 100644
index 0000000..cc54937
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/AuthOrchestrator.kt
@@ -0,0 +1,66 @@
+package com.homeservices.customer.domain.auth
+
+import android.content.Context
+import androidx.fragment.app.FragmentActivity
+import com.google.firebase.auth.FirebaseUser
+import com.google.firebase.auth.PhoneAuthCredential
+import com.homeservices.customer.domain.auth.model.AuthResult
+import com.homeservices.customer.domain.auth.model.OtpSendResult
+import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
+import kotlinx.coroutines.flow.Flow
+import kotlinx.coroutines.flow.SharedFlow
+import javax.inject.Inject
+import javax.inject.Singleton
+
+@Singleton
+public class AuthOrchestrator
+    @Inject
+    constructor(
+        private val truecallerUseCase: TruecallerLoginUseCase,
+        private val firebaseOtpUseCase: FirebaseOtpUseCase,
+        private val saveSessionUseCase: SaveSessionUseCase,
+    ) {
+        public sealed class StartResult {
+            public data object TruecallerLaunched : StartResult()
+
+            public data object FallbackToOtp : StartResult()
+        }
+
+        public fun start(
+            context: Context,
+            activity: FragmentActivity,
+        ): StartResult {
+            truecallerUseCase.init(context)
+            return if (truecallerUseCase.isAvailable()) {
+                truecallerUseCase.launch(activity)
+                StartResult.TruecallerLaunched
+            } else {
+                StartResult.FallbackToOtp
+            }
+        }
+
+        public fun observeTruecallerResults(): SharedFlow<TruecallerAuthResult> = truecallerUseCase.resultFlow
+
+        public fun sendOtp(
+            phoneNumber: String,
+            activity: FragmentActivity,
+            resendToken: com.google.firebase.auth.PhoneAuthProvider.ForceResendingToken? = null,
+        ): Flow<OtpSendResult> = firebaseOtpUseCase.sendOtp(phoneNumber, activity, resendToken)
+
+        public fun verifyOtp(
+            verificationId: String,
+            code: String,
+        ): Flow<AuthResult> = firebaseOtpUseCase.verifyOtp(verificationId, code)
+
+        public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> =
+            firebaseOtpUseCase.signInWithCredential(credential)
+
+        public suspend fun completeWithTruecaller(phoneNumber: String): AuthResult = saveSessionUseCase.saveAnonymousWithPhone(phoneNumber)
+
+        public suspend fun completeWithFirebase(
+            user: FirebaseUser,
+            phoneLastFour: String,
+        ) {
+            saveSessionUseCase.save(user, phoneLastFour)
+        }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCase.kt
new file mode 100644
index 0000000..f7318fb
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCase.kt
@@ -0,0 +1,85 @@
+package com.homeservices.customer.domain.auth
+
+import android.content.Context
+import androidx.biometric.BiometricManager
+import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
+import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
+import androidx.biometric.BiometricPrompt
+import androidx.core.content.ContextCompat
+import androidx.fragment.app.FragmentActivity
+import com.homeservices.customer.domain.auth.model.BiometricResult
+import kotlinx.coroutines.suspendCancellableCoroutine
+import javax.inject.Inject
+import kotlin.coroutines.resume
+
+public class BiometricGateUseCase
+    @Inject
+    constructor() {
+        public fun canUseBiometric(context: Context): Boolean =
+            BiometricManager
+                .from(context)
+                .canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL) ==
+                BiometricManager.BIOMETRIC_SUCCESS
+
+        /**
+         * Shows a biometric prompt and suspends until the user authenticates, cancels, or an error
+         * occurs. Caller should check [canUseBiometric] first — if false, skip this call entirely.
+         *
+         * Usage in future ViewModels:
+         * ```
+         * if (biometricGate.canUseBiometric(context)) {
+         *     val result = biometricGate.requestAuth(activity, "Confirm Booking", "Use biometric")
+         *     if (result !is BiometricResult.Authenticated) return
+         * }
+         * // proceed with sensitive action
+         * ```
+         */
+        public suspend fun requestAuth(
+            activity: FragmentActivity,
+            title: String,
+            subtitle: String,
+        ): BiometricResult =
+            suspendCancellableCoroutine { continuation ->
+                val executor = ContextCompat.getMainExecutor(activity)
+
+                val callback =
+                    object : BiometricPrompt.AuthenticationCallback() {
+                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
+                            if (continuation.isActive) continuation.resume(BiometricResult.Authenticated)
+                        }
+
+                        override fun onAuthenticationError(
+                            errorCode: Int,
+                            errString: CharSequence,
+                        ) {
+                            if (!continuation.isActive) return
+                            val mapped =
+                                when (errorCode) {
+                                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> BiometricResult.Lockout
+                                    BiometricPrompt.ERROR_HW_NOT_PRESENT,
+                                    BiometricPrompt.ERROR_HW_UNAVAILABLE,
+                                    BiometricPrompt.ERROR_NO_BIOMETRICS,
+                                    BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL,
+                                    -> BiometricResult.HardwareAbsent
+                                    else -> BiometricResult.Cancelled
+                                }
+                            continuation.resume(mapped)
+                        }
+
+                        override fun onAuthenticationFailed() = Unit
+                    }
+
+                val promptInfo =
+                    BiometricPrompt.PromptInfo
+                        .Builder()
+                        .setTitle(title)
+                        .setSubtitle(subtitle)
+                        .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
+                        .build()
+
+                val prompt = BiometricPrompt(activity, executor, callback)
+                prompt.authenticate(promptInfo)
+
+                continuation.invokeOnCancellation { prompt.cancelAuthentication() }
+            }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt
new file mode 100644
index 0000000..a1668f0
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt
@@ -0,0 +1,111 @@
+package com.homeservices.customer.domain.auth
+
+import android.app.Activity
+import com.google.firebase.FirebaseException
+import com.google.firebase.auth.FirebaseAuth
+import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
+import com.google.firebase.auth.PhoneAuthCredential
+import com.google.firebase.auth.PhoneAuthOptions
+import com.google.firebase.auth.PhoneAuthProvider
+import com.homeservices.customer.domain.auth.model.AuthResult
+import com.homeservices.customer.domain.auth.model.OtpSendResult
+import kotlinx.coroutines.channels.awaitClose
+import kotlinx.coroutines.flow.Flow
+import kotlinx.coroutines.flow.callbackFlow
+import java.util.concurrent.TimeUnit
+import javax.inject.Inject
+import javax.inject.Singleton
+
+@Singleton
+public class FirebaseOtpUseCase
+    @Inject
+    constructor(
+        private val firebaseAuth: FirebaseAuth,
+    ) {
+        private companion object {
+            const val OTP_TIMEOUT_SECONDS = 60L
+        }
+
+        public fun sendOtp(
+            phoneNumber: String,
+            activity: Activity,
+            resendToken: PhoneAuthProvider.ForceResendingToken? = null,
+        ): Flow<OtpSendResult> =
+            callbackFlow {
+                val callbacks =
+                    object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
+                        override fun onVerificationCompleted(credential: PhoneAuthCredential) {
+                            trySend(OtpSendResult.AutoVerified(credential))
+                            close()
+                        }
+
+                        override fun onVerificationFailed(e: FirebaseException) {
+                            trySend(OtpSendResult.Error(e))
+                            close()
+                        }
+
+                        override fun onCodeSent(
+                            verificationId: String,
+                            token: PhoneAuthProvider.ForceResendingToken,
+                        ) {
+                            trySend(OtpSendResult.CodeSent(verificationId, token))
+                            // channel stays open — awaiting auto-verify or user code submission
+                        }
+                    }
+
+                val optionsBuilder =
+                    PhoneAuthOptions
+                        .newBuilder(firebaseAuth)
+                        .setPhoneNumber(phoneNumber)
+                        .setTimeout(OTP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
+                        .setActivity(activity)
+                        .setCallbacks(callbacks)
+
+                resendToken?.let { optionsBuilder.setForceResendingToken(it) }
+
+                PhoneAuthProvider.verifyPhoneNumber(optionsBuilder.build())
+                awaitClose()
+            }
+
+        public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> =
+            callbackFlow {
+                val executor = java.util.concurrent.Executor { it.run() }
+                firebaseAuth
+                    .signInWithCredential(credential)
+                    .addOnSuccessListener(executor) { result ->
+                        val user = result.user
+                        if (user != null) {
+                            trySend(AuthResult.Success(user))
+                        } else {
+                            trySend(AuthResult.Error.General(IllegalStateException("null user after sign-in")))
+                        }
+                        close()
+                    }.addOnFailureListener(executor) { e ->
+                        val mapped =
+                            when {
+                                e is FirebaseAuthInvalidCredentialsException &&
+                                    e.message?.contains("ERROR_INVALID_VERIFICATION_CODE") == true ->
+                                    AuthResult.Error.WrongCode
+
+                                e.message?.contains("ERROR_SESSION_EXPIRED") == true ->
+                                    AuthResult.Error.CodeExpired
+
+                                e.message?.contains("ERROR_TOO_MANY_REQUESTS") == true ->
+                                    AuthResult.Error.RateLimited
+
+                                else -> AuthResult.Error.General(e)
+                            }
+                        trySend(mapped)
+                        close()
+                    }
+                awaitClose()
+            }
+
+        public fun verifyOtp(
+            verificationId: String,
+            code: String,
+        ): Flow<AuthResult> {
+            val credential = PhoneAuthProvider.getCredential(verificationId, code)
+            return signInWithCredential(credential)
+        }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt
new file mode 100644
index 0000000..a7025c9
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt
@@ -0,0 +1,48 @@
+package com.homeservices.customer.domain.auth
+
+import com.google.firebase.FirebaseException
+import com.google.firebase.auth.FirebaseAuth
+import com.google.firebase.auth.FirebaseUser
+import com.homeservices.customer.data.auth.SessionManager
+import com.homeservices.customer.domain.auth.model.AuthResult
+import kotlinx.coroutines.tasks.await
+import javax.inject.Inject
+import javax.inject.Singleton
+
+@Singleton
+public class SaveSessionUseCase
+    @Inject
+    constructor(
+        private val sessionManager: SessionManager,
+        private val firebaseAuth: FirebaseAuth,
+    ) {
+        private companion object {
+            const val PHONE_LAST_DIGITS = 4
+        }
+
+        public suspend fun save(
+            user: FirebaseUser,
+            phoneLastFour: String,
+        ) {
+            sessionManager.saveSession(user.uid, phoneLastFour)
+        }
+
+        /**
+         * Truecaller pilot path: signs in anonymously to Firebase, stores uid + last 4 digits.
+         * Phase 2 replaces this with Firebase custom-token flow. See ADR-0005.
+         */
+        public suspend fun saveAnonymousWithPhone(phoneNumber: String): AuthResult {
+            return try {
+                val result = firebaseAuth.signInAnonymously().await()
+                val user =
+                    result.user ?: return AuthResult.Error.General(
+                        IllegalStateException("null user after anonymous sign-in"),
+                    )
+                val lastFour = phoneNumber.takeLast(PHONE_LAST_DIGITS)
+                sessionManager.saveSession(user.uid, lastFour)
+                AuthResult.Success(user)
+            } catch (e: FirebaseException) {
+                AuthResult.Error.General(e)
+            }
+        }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/TruecallerLoginUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/TruecallerLoginUseCase.kt
new file mode 100644
index 0000000..bb92945
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/TruecallerLoginUseCase.kt
@@ -0,0 +1,71 @@
+package com.homeservices.customer.domain.auth
+
+import android.content.Context
+import androidx.fragment.app.FragmentActivity
+import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
+import com.truecaller.android.sdk.common.models.TrueProfile
+import com.truecaller.android.sdk.legacy.ITrueCallback
+import com.truecaller.android.sdk.legacy.TrueError
+import com.truecaller.android.sdk.legacy.TruecallerSDK
+import com.truecaller.android.sdk.legacy.TruecallerSdkScope
+import kotlinx.coroutines.flow.MutableSharedFlow
+import kotlinx.coroutines.flow.SharedFlow
+import kotlinx.coroutines.flow.asSharedFlow
+import javax.inject.Inject
+import javax.inject.Singleton
+
+@Singleton
+public class TruecallerLoginUseCase
+    @Inject
+    constructor() {
+        private val _resultFlow = MutableSharedFlow<TruecallerAuthResult>(replay = 1)
+        public val resultFlow: SharedFlow<TruecallerAuthResult> = _resultFlow.asSharedFlow()
+
+        internal val sdkCallback: ITrueCallback =
+            object : ITrueCallback {
+                override fun onSuccessProfileShared(profile: TrueProfile) {
+                    _resultFlow.tryEmit(TruecallerAuthResult.Success(profile.phoneNumber.takeLast(4)))
+                }
+
+                override fun onFailureProfileShared(error: TrueError) {
+                    _resultFlow.tryEmit(TruecallerAuthResult.Failure(error.errorType))
+                }
+
+                override fun onVerificationRequired(error: TrueError?) {
+                    _resultFlow.tryEmit(TruecallerAuthResult.Cancelled)
+                }
+            }
+
+        // TruecallerSDK.getInstance() throws IllegalStateException if not yet initialised —
+        // that is the expected signal to call init(). Exception is not lost; it drives the init path.
+        @Suppress("SwallowedException")
+        public fun init(context: Context) {
+            try {
+                TruecallerSDK.getInstance()
+            } catch (e: IllegalStateException) {
+                val scope =
+                    TruecallerSdkScope
+                        .Builder(context, sdkCallback)
+                        .sdkOptions(TruecallerSdkScope.SDK_OPTION_WITHOUT_OTP)
+                        .build()
+                TruecallerSDK.init(scope)
+            }
+        }
+
+        // TruecallerSDK.getInstance() throws if SDK not yet initialised — graceful degradation to OTP.
+        @Suppress("SwallowedException")
+        public fun isAvailable(): Boolean =
+            try {
+                TruecallerSDK.getInstance().isUsable
+            } catch (e: IllegalStateException) {
+                false
+            }
+
+        public fun launch(activity: FragmentActivity) {
+            TruecallerSDK.getInstance().getUserProfile(activity)
+        }
+
+        internal fun simulateSdkCallback(block: (ITrueCallback) -> Unit) {
+            block(sdkCallback)
+        }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthResult.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthResult.kt
new file mode 100644
index 0000000..f8abcc9
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthResult.kt
@@ -0,0 +1,25 @@
+package com.homeservices.customer.domain.auth.model
+
+import com.google.firebase.auth.FirebaseUser
+
+public sealed class AuthResult {
+    public data class Success(
+        val user: FirebaseUser,
+    ) : AuthResult()
+
+    public data object Cancelled : AuthResult()
+
+    public data object Unavailable : AuthResult()
+
+    public sealed class Error : AuthResult() {
+        public data class General(
+            val cause: Throwable,
+        ) : Error()
+
+        public data object RateLimited : Error()
+
+        public data object WrongCode : Error()
+
+        public data object CodeExpired : Error()
+    }
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthState.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthState.kt
new file mode 100644
index 0000000..0afa656
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthState.kt
@@ -0,0 +1,10 @@
+package com.homeservices.customer.domain.auth.model
+
+public sealed class AuthState {
+    public data object Unauthenticated : AuthState()
+
+    public data class Authenticated(
+        public val uid: String,
+        public val phoneLastFour: String,
+    ) : AuthState()
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/BiometricResult.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/BiometricResult.kt
new file mode 100644
index 0000000..4c7af05
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/BiometricResult.kt
@@ -0,0 +1,11 @@
+package com.homeservices.customer.domain.auth.model
+
+public sealed class BiometricResult {
+    public data object Authenticated : BiometricResult()
+
+    public data object Cancelled : BiometricResult()
+
+    public data object Lockout : BiometricResult()
+
+    public data object HardwareAbsent : BiometricResult()
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/OtpSendResult.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/OtpSendResult.kt
new file mode 100644
index 0000000..af2065c
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/OtpSendResult.kt
@@ -0,0 +1,19 @@
+package com.homeservices.customer.domain.auth.model
+
+import com.google.firebase.auth.PhoneAuthCredential
+import com.google.firebase.auth.PhoneAuthProvider
+
+public sealed class OtpSendResult {
+    public data class CodeSent(
+        val verificationId: String,
+        val resendToken: PhoneAuthProvider.ForceResendingToken,
+    ) : OtpSendResult()
+
+    public data class AutoVerified(
+        val credential: PhoneAuthCredential,
+    ) : OtpSendResult()
+
+    public data class Error(
+        val cause: Throwable,
+    ) : OtpSendResult()
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/TruecallerAuthResult.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/TruecallerAuthResult.kt
new file mode 100644
index 0000000..b3cafb8
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/TruecallerAuthResult.kt
@@ -0,0 +1,13 @@
+package com.homeservices.customer.domain.auth.model
+
+public sealed class TruecallerAuthResult {
+    public data class Success(
+        val phoneLastFour: String,
+    ) : TruecallerAuthResult()
+
+    public data class Failure(
+        val errorType: Int,
+    ) : TruecallerAuthResult()
+
+    public data object Cancelled : TruecallerAuthResult()
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
new file mode 100644
index 0000000..b2db8c6
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
@@ -0,0 +1,46 @@
+package com.homeservices.customer.navigation
+
+import androidx.compose.runtime.Composable
+import androidx.compose.runtime.LaunchedEffect
+import androidx.compose.runtime.getValue
+import androidx.compose.ui.Modifier
+import androidx.fragment.app.FragmentActivity
+import androidx.lifecycle.compose.collectAsStateWithLifecycle
+import androidx.navigation.compose.NavHost
+import androidx.navigation.compose.rememberNavController
+import com.homeservices.customer.data.auth.SessionManager
+import com.homeservices.customer.domain.auth.model.AuthState
+
+@Composable
+internal fun AppNavigation(
+    sessionManager: SessionManager,
+    activity: FragmentActivity,
+    modifier: Modifier = Modifier,
+) {
+    val navController = rememberNavController()
+    val authState by sessionManager.authState.collectAsStateWithLifecycle()
+
+    LaunchedEffect(authState) {
+        when (authState) {
+            is AuthState.Authenticated ->
+                navController.navigate("main") {
+                    popUpTo("auth") { inclusive = true }
+                    launchSingleTop = true
+                }
+            is AuthState.Unauthenticated ->
+                navController.navigate("auth") {
+                    popUpTo("main") { inclusive = true }
+                    launchSingleTop = true
+                }
+        }
+    }
+
+    NavHost(
+        navController = navController,
+        startDestination = "auth",
+        modifier = modifier,
+    ) {
+        authGraph(navController, activity)
+        mainGraph()
+    }
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AuthGraph.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AuthGraph.kt
new file mode 100644
index 0000000..45c3b4f
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AuthGraph.kt
@@ -0,0 +1,39 @@
+package com.homeservices.customer.navigation
+
+import androidx.compose.runtime.LaunchedEffect
+import androidx.compose.runtime.getValue
+import androidx.fragment.app.FragmentActivity
+import androidx.hilt.navigation.compose.hiltViewModel
+import androidx.lifecycle.compose.collectAsStateWithLifecycle
+import androidx.navigation.NavController
+import androidx.navigation.NavGraphBuilder
+import androidx.navigation.compose.composable
+import androidx.navigation.navigation
+import com.homeservices.customer.ui.auth.AuthScreen
+import com.homeservices.customer.ui.auth.AuthViewModel
+
+// navController will be used in E02-S02 when navigating to HomeGraph on successful auth
+@Suppress("UnusedParameter")
+internal fun NavGraphBuilder.authGraph(
+    navController: NavController,
+    activity: FragmentActivity,
+) {
+    navigation(startDestination = "auth_screen", route = "auth") {
+        composable("auth_screen") {
+            val viewModel: AuthViewModel = hiltViewModel()
+            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
+
+            LaunchedEffect(Unit) {
+                viewModel.initAuth(activity)
+            }
+
+            AuthScreen(
+                uiState = uiState,
+                onPhoneSubmitted = { phone -> viewModel.onPhoneNumberSubmitted(phone, activity) },
+                onOtpEntered = viewModel::onOtpEntered,
+                onResendRequested = { viewModel.onOtpResendRequested(activity) },
+                onRetry = viewModel::onRetry,
+            )
+        }
+    }
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt
new file mode 100644
index 0000000..29dc2d4
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt
@@ -0,0 +1,14 @@
+package com.homeservices.customer.navigation
+
+import androidx.navigation.NavGraphBuilder
+import androidx.navigation.compose.composable
+import androidx.navigation.navigation
+import com.homeservices.customer.ui.home.HomeScreen
+
+internal fun NavGraphBuilder.mainGraph() {
+    navigation(startDestination = "home", route = "main") {
+        composable("home") {
+            HomeScreen()
+        }
+    }
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt
new file mode 100644
index 0000000..b08477b
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt
@@ -0,0 +1,234 @@
+package com.homeservices.customer.ui.auth
+
+import androidx.compose.foundation.layout.Arrangement
+import androidx.compose.foundation.layout.Box
+import androidx.compose.foundation.layout.Column
+import androidx.compose.foundation.layout.Spacer
+import androidx.compose.foundation.layout.fillMaxSize
+import androidx.compose.foundation.layout.fillMaxWidth
+import androidx.compose.foundation.layout.height
+import androidx.compose.foundation.layout.padding
+import androidx.compose.foundation.text.KeyboardOptions
+import androidx.compose.material3.Button
+import androidx.compose.material3.CircularProgressIndicator
+import androidx.compose.material3.MaterialTheme
+import androidx.compose.material3.OutlinedTextField
+import androidx.compose.material3.Surface
+import androidx.compose.material3.Text
+import androidx.compose.material3.TextButton
+import androidx.compose.runtime.Composable
+import androidx.compose.runtime.getValue
+import androidx.compose.runtime.mutableStateOf
+import androidx.compose.runtime.remember
+import androidx.compose.runtime.setValue
+import androidx.compose.ui.Alignment
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.text.input.KeyboardType
+import androidx.compose.ui.text.style.TextAlign
+import androidx.compose.ui.unit.dp
+
+private const val PHONE_LAST_DIGITS = 4
+
+@Composable
+internal fun AuthScreen(
+    uiState: AuthUiState,
+    onPhoneSubmitted: (String) -> Unit,
+    onOtpEntered: (String) -> Unit,
+    onResendRequested: () -> Unit,
+    onRetry: () -> Unit,
+    modifier: Modifier = Modifier,
+) {
+    Surface(
+        modifier = modifier.fillMaxSize(),
+        color = MaterialTheme.colorScheme.background,
+    ) {
+        when (uiState) {
+            is AuthUiState.Idle, is AuthUiState.TruecallerLoading ->
+                TruecallerLoadingContent()
+
+            is AuthUiState.OtpEntry -> {
+                if (uiState.verificationId == null) {
+                    PhoneEntryContent(
+                        initialPhone = uiState.phoneNumber,
+                        onPhoneSubmitted = onPhoneSubmitted,
+                    )
+                } else {
+                    OtpCodeContent(
+                        phoneNumber = uiState.phoneNumber,
+                        onOtpEntered = onOtpEntered,
+                        onResendRequested = onResendRequested,
+                    )
+                }
+            }
+
+            is AuthUiState.OtpSending ->
+                LoadingContent(message = "Sending OTP\u2026")
+
+            is AuthUiState.OtpVerifying ->
+                LoadingContent(message = "Verifying\u2026")
+
+            is AuthUiState.Error ->
+                ErrorContent(state = uiState, onRetry = onRetry)
+        }
+    }
+}
+
+@Composable
+private fun TruecallerLoadingContent() {
+    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
+        Column(horizontalAlignment = Alignment.CenterHorizontally) {
+            CircularProgressIndicator()
+            Spacer(modifier = Modifier.height(16.dp))
+            Text(
+                text = "Verifying with Truecaller\u2026",
+                style = MaterialTheme.typography.bodyMedium,
+            )
+        }
+    }
+}
+
+@Composable
+private fun PhoneEntryContent(
+    initialPhone: String,
+    onPhoneSubmitted: (String) -> Unit,
+) {
+    var phone by remember { mutableStateOf(initialPhone) }
+
+    Column(
+        modifier =
+            Modifier
+                .fillMaxSize()
+                .padding(horizontal = 32.dp),
+        verticalArrangement = Arrangement.Center,
+        horizontalAlignment = Alignment.CenterHorizontally,
+    ) {
+        Text(
+            text = "Enter your mobile number",
+            style = MaterialTheme.typography.headlineSmall,
+            textAlign = TextAlign.Center,
+        )
+        Spacer(modifier = Modifier.height(8.dp))
+        Text(
+            text = "We\u2019ll send a one-time code to verify your number",
+            style = MaterialTheme.typography.bodyMedium,
+            textAlign = TextAlign.Center,
+            color = MaterialTheme.colorScheme.onSurfaceVariant,
+        )
+        Spacer(modifier = Modifier.height(32.dp))
+        OutlinedTextField(
+            value = phone,
+            onValueChange = { phone = it },
+            label = { Text("Mobile number") },
+            placeholder = { Text("+91 98765 43210") },
+            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
+            singleLine = true,
+            modifier = Modifier.fillMaxWidth(),
+        )
+        Spacer(modifier = Modifier.height(8.dp))
+        Text(
+            text = "By continuing, you agree to our Terms of Service and Privacy Policy.",
+            style = MaterialTheme.typography.labelSmall,
+            color = MaterialTheme.colorScheme.onSurfaceVariant,
+            textAlign = TextAlign.Center,
+        )
+        Spacer(modifier = Modifier.height(24.dp))
+        Button(
+            onClick = { onPhoneSubmitted(phone.trim()) },
+            enabled = phone.isNotBlank(),
+            modifier = Modifier.fillMaxWidth(),
+        ) {
+            Text("Get OTP")
+        }
+    }
+}
+
+@Composable
+private fun OtpCodeContent(
+    phoneNumber: String,
+    onOtpEntered: (String) -> Unit,
+    onResendRequested: () -> Unit,
+) {
+    var otp by remember { mutableStateOf("") }
+    val lastFour = phoneNumber.takeLast(PHONE_LAST_DIGITS).ifEmpty { "your number" }
+
+    Column(
+        modifier =
+            Modifier
+                .fillMaxSize()
+                .padding(horizontal = 32.dp),
+        verticalArrangement = Arrangement.Center,
+        horizontalAlignment = Alignment.CenterHorizontally,
+    ) {
+        Text(
+            text = "Enter the code we sent to \u2022\u2022\u2022\u2022$lastFour",
+            style = MaterialTheme.typography.headlineSmall,
+            textAlign = TextAlign.Center,
+        )
+        Spacer(modifier = Modifier.height(32.dp))
+        OutlinedTextField(
+            value = otp,
+            onValueChange = { if (it.length <= 6) otp = it },
+            label = { Text("6-digit code") },
+            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
+            singleLine = true,
+            modifier = Modifier.fillMaxWidth(),
+        )
+        Spacer(modifier = Modifier.height(24.dp))
+        Button(
+            onClick = { onOtpEntered(otp.trim()) },
+            enabled = otp.length == 6,
+            modifier = Modifier.fillMaxWidth(),
+        ) {
+            Text("Verify")
+        }
+        Spacer(modifier = Modifier.height(8.dp))
+        TextButton(onClick = onResendRequested) {
+            Text("Resend code")
+        }
+    }
+}
+
+@Composable
+private fun LoadingContent(message: String) {
+    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
+        Column(horizontalAlignment = Alignment.CenterHorizontally) {
+            CircularProgressIndicator()
+            Spacer(modifier = Modifier.height(16.dp))
+            Text(text = message, style = MaterialTheme.typography.bodyMedium)
+        }
+    }
+}
+
+@Composable
+private fun ErrorContent(
+    state: AuthUiState.Error,
+    onRetry: () -> Unit,
+) {
+    Column(
+        modifier =
+            Modifier
+                .fillMaxSize()
+                .padding(horizontal = 32.dp),
+        verticalArrangement = Arrangement.Center,
+        horizontalAlignment = Alignment.CenterHorizontally,
+    ) {
+        Text(
+            text = state.message,
+            style = MaterialTheme.typography.bodyLarge,
+            color = MaterialTheme.colorScheme.error,
+            textAlign = TextAlign.Center,
+        )
+        if (state.retriesLeft > 0) {
+            Spacer(modifier = Modifier.height(8.dp))
+            Text(
+                text = "${state.retriesLeft} attempt${if (state.retriesLeft == 1) "" else "s"} remaining",
+                style = MaterialTheme.typography.bodySmall,
+                color = MaterialTheme.colorScheme.onSurfaceVariant,
+            )
+        }
+        Spacer(modifier = Modifier.height(24.dp))
+        Button(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
+            Text("Try again")
+        }
+    }
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthUiState.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthUiState.kt
new file mode 100644
index 0000000..063cd08
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthUiState.kt
@@ -0,0 +1,21 @@
+package com.homeservices.customer.ui.auth
+
+public sealed class AuthUiState {
+    public data object Idle : AuthUiState()
+
+    public data object TruecallerLoading : AuthUiState()
+
+    public data class OtpEntry(
+        val phoneNumber: String = "",
+        val verificationId: String? = null,
+    ) : AuthUiState()
+
+    public data object OtpSending : AuthUiState()
+
+    public data object OtpVerifying : AuthUiState()
+
+    public data class Error(
+        val message: String,
+        val retriesLeft: Int,
+    ) : AuthUiState()
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt
new file mode 100644
index 0000000..b288ee3
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt
@@ -0,0 +1,159 @@
+package com.homeservices.customer.ui.auth
+
+import androidx.fragment.app.FragmentActivity
+import androidx.lifecycle.ViewModel
+import androidx.lifecycle.viewModelScope
+import com.google.firebase.auth.PhoneAuthProvider
+import com.homeservices.customer.domain.auth.AuthOrchestrator
+import com.homeservices.customer.domain.auth.model.AuthResult
+import com.homeservices.customer.domain.auth.model.OtpSendResult
+import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
+import dagger.hilt.android.lifecycle.HiltViewModel
+import kotlinx.coroutines.flow.MutableStateFlow
+import kotlinx.coroutines.flow.StateFlow
+import kotlinx.coroutines.flow.asStateFlow
+import kotlinx.coroutines.launch
+import javax.inject.Inject
+
+@HiltViewModel
+public class AuthViewModel
+    @Inject
+    constructor(
+        private val orchestrator: AuthOrchestrator,
+    ) : ViewModel() {
+        private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
+        public val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()
+
+        private companion object {
+            const val MAX_OTP_RETRIES = 3
+            const val PHONE_LAST_DIGITS = 4
+        }
+
+        private var currentVerificationId: String? = null
+        private var currentResendToken: PhoneAuthProvider.ForceResendingToken? = null
+        private var currentPhoneNumber: String = ""
+        private var otpAttempts: Int = 0
+
+        public fun initAuth(activity: FragmentActivity) {
+            // FragmentActivity IS-A Context; pass it for both the Context and FragmentActivity params
+            when (orchestrator.start(activity, activity)) {
+                AuthOrchestrator.StartResult.TruecallerLaunched -> {
+                    _uiState.value = AuthUiState.TruecallerLoading
+                    viewModelScope.launch {
+                        orchestrator.observeTruecallerResults().collect { result ->
+                            handleTruecallerResult(result)
+                        }
+                    }
+                }
+                AuthOrchestrator.StartResult.FallbackToOtp -> {
+                    _uiState.value = AuthUiState.OtpEntry()
+                }
+            }
+        }
+
+        private fun handleTruecallerResult(result: TruecallerAuthResult) {
+            when (result) {
+                is TruecallerAuthResult.Success -> {
+                    viewModelScope.launch {
+                        val authResult = orchestrator.completeWithTruecaller(result.phoneLastFour)
+                        if (authResult is AuthResult.Error) {
+                            _uiState.value =
+                                AuthUiState.Error(
+                                    message = "Sign-in failed. Please use OTP.",
+                                    retriesLeft = 0,
+                                )
+                        }
+                    }
+                }
+                is TruecallerAuthResult.Failure, TruecallerAuthResult.Cancelled -> {
+                    _uiState.value = AuthUiState.OtpEntry()
+                }
+            }
+        }
+
+        public fun onPhoneNumberSubmitted(
+            phoneNumber: String,
+            activity: FragmentActivity,
+            resendToken: PhoneAuthProvider.ForceResendingToken? = null,
+        ) {
+            currentPhoneNumber = phoneNumber
+            _uiState.value = AuthUiState.OtpSending
+            viewModelScope.launch {
+                orchestrator.sendOtp(phoneNumber, activity, resendToken).collect { result ->
+                    when (result) {
+                        is OtpSendResult.CodeSent -> {
+                            currentVerificationId = result.verificationId
+                            currentResendToken = result.resendToken
+                            _uiState.value =
+                                AuthUiState.OtpEntry(
+                                    phoneNumber = phoneNumber,
+                                    verificationId = result.verificationId,
+                                )
+                        }
+                        is OtpSendResult.AutoVerified -> {
+                            orchestrator.signInWithCredential(result.credential).collect { authResult ->
+                                handleFirebaseAuthResult(authResult)
+                            }
+                        }
+                        is OtpSendResult.Error -> {
+                            _uiState.value =
+                                AuthUiState.Error(
+                                    message = "Failed to send OTP. Check your number and connection.",
+                                    retriesLeft = MAX_OTP_RETRIES,
+                                )
+                        }
+                    }
+                }
+            }
+        }
+
+        public fun onOtpEntered(code: String) {
+            val verificationId = currentVerificationId ?: return
+            _uiState.value = AuthUiState.OtpVerifying
+            viewModelScope.launch {
+                orchestrator.verifyOtp(verificationId, code).collect { result ->
+                    handleFirebaseAuthResult(result)
+                }
+            }
+        }
+
+        public fun onOtpResendRequested(activity: FragmentActivity) {
+            otpAttempts = 0
+            onPhoneNumberSubmitted(currentPhoneNumber, activity, currentResendToken)
+        }
+
+        public fun onRetry() {
+            otpAttempts = 0
+            currentVerificationId = null
+            currentResendToken = null
+            _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
+        }
+
+        private suspend fun handleFirebaseAuthResult(result: AuthResult) {
+            when (result) {
+                is AuthResult.Success -> {
+                    orchestrator.completeWithFirebase(result.user, currentPhoneNumber.takeLast(PHONE_LAST_DIGITS))
+                }
+                is AuthResult.Error.WrongCode -> {
+                    otpAttempts++
+                    _uiState.value =
+                        AuthUiState.Error(
+                            message = "Incorrect code",
+                            retriesLeft = maxOf(0, MAX_OTP_RETRIES - otpAttempts),
+                        )
+                }
+                is AuthResult.Error.RateLimited ->
+                    _uiState.value = AuthUiState.Error("Too many attempts. Try again later.", retriesLeft = 0)
+                is AuthResult.Error.CodeExpired ->
+                    _uiState.value = AuthUiState.Error("Code expired. Please resend.", retriesLeft = 0)
+                is AuthResult.Error.General ->
+                    _uiState.value =
+                        AuthUiState.Error(
+                            "Sign-in failed. Please try again.",
+                            retriesLeft = 0,
+                        )
+                is AuthResult.Cancelled, is AuthResult.Unavailable ->
+                    _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
+            }
+        }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/home/HomeScreen.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/home/HomeScreen.kt
new file mode 100644
index 0000000..d8fc605
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/home/HomeScreen.kt
@@ -0,0 +1,28 @@
+package com.homeservices.customer.ui.home
+
+import androidx.compose.foundation.layout.Box
+import androidx.compose.foundation.layout.fillMaxSize
+import androidx.compose.material3.MaterialTheme
+import androidx.compose.material3.Surface
+import androidx.compose.material3.Text
+import androidx.compose.runtime.Composable
+import androidx.compose.ui.Alignment
+import androidx.compose.ui.Modifier
+
+@Composable
+internal fun HomeScreen(modifier: Modifier = Modifier) {
+    Surface(
+        modifier = modifier.fillMaxSize(),
+        color = MaterialTheme.colorScheme.background,
+    ) {
+        Box(
+            modifier = Modifier.fillMaxSize(),
+            contentAlignment = Alignment.Center,
+        ) {
+            Text(
+                text = "Home — coming soon",
+                style = MaterialTheme.typography.bodyLarge,
+            )
+        }
+    }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionManagerTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionManagerTest.kt
new file mode 100644
index 0000000..74976d8
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionManagerTest.kt
@@ -0,0 +1,117 @@
+package com.homeservices.customer.data.auth
+
+import android.content.Context
+import android.content.SharedPreferences
+import androidx.test.core.app.ApplicationProvider
+import com.homeservices.customer.domain.auth.model.AuthState
+import kotlinx.coroutines.test.runTest
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.After
+import org.junit.Before
+import org.junit.Test
+import org.junit.runner.RunWith
+import org.robolectric.RobolectricTestRunner
+
+@RunWith(RobolectricTestRunner::class)
+public class SessionManagerTest {
+    private lateinit var prefs: SharedPreferences
+    private lateinit var sessionManager: SessionManager
+
+    @Before
+    public fun setUp() {
+        val context = ApplicationProvider.getApplicationContext<Context>()
+        prefs = context.getSharedPreferences("test_auth_session", Context.MODE_PRIVATE)
+        sessionManager = SessionManager(prefs)
+    }
+
+    @After
+    public fun tearDown() {
+        prefs.edit().clear().apply()
+    }
+
+    @Test
+    public fun `initial state is Unauthenticated when prefs are empty`() {
+        assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
+    }
+
+    @Test
+    public fun `saveSession stores uid and phoneLastFour and transitions to Authenticated`(): Unit =
+        runTest {
+            sessionManager.saveSession("uid-abc", "5678")
+
+            assertThat(sessionManager.authState.value)
+                .isEqualTo(AuthState.Authenticated(uid = "uid-abc", phoneLastFour = "5678"))
+            assertThat(prefs.getString("uid", null)).isEqualTo("uid-abc")
+            assertThat(prefs.getString("phone_last_four", null)).isEqualTo("5678")
+        }
+
+    @Test
+    public fun `clearSession removes all prefs and transitions to Unauthenticated`(): Unit =
+        runTest {
+            sessionManager.saveSession("uid-abc", "5678")
+            sessionManager.clearSession()
+
+            assertThat(sessionManager.authState.value).isEqualTo(AuthState.Unauthenticated)
+            assertThat(prefs.getString("uid", null)).isNull()
+        }
+
+    @Test
+    public fun `initial state is Authenticated when valid session exists in prefs`() {
+        prefs
+            .edit()
+            .putString("uid", "uid-xyz")
+            .putString("phone_last_four", "1234")
+            .putLong("session_created_at_epoch_ms", System.currentTimeMillis())
+            .apply()
+        val freshManager = SessionManager(prefs)
+
+        assertThat(freshManager.authState.value)
+            .isEqualTo(AuthState.Authenticated(uid = "uid-xyz", phoneLastFour = "1234"))
+    }
+
+    @Test
+    public fun `initial state is Unauthenticated when session is older than 180 days`() {
+        val expiredTs = System.currentTimeMillis() - (181L * 24 * 60 * 60 * 1000)
+        prefs
+            .edit()
+            .putString("uid", "uid-old")
+            .putString("phone_last_four", "9999")
+            .putLong("session_created_at_epoch_ms", expiredTs)
+            .apply()
+        val freshManager = SessionManager(prefs)
+
+        assertThat(freshManager.authState.value).isEqualTo(AuthState.Unauthenticated)
+        assertThat(prefs.getString("uid", null)).isNull()
+    }
+
+    @Test
+    public fun `initial state is Unauthenticated when session_created_at is zero`() {
+        // Covers the `createdAt == 0L` branch in readInitialState
+        prefs
+            .edit()
+            .putString("uid", "uid-zero")
+            .putString("phone_last_four", "1111")
+            .putLong("session_created_at_epoch_ms", 0L)
+            .apply()
+        val freshManager = SessionManager(prefs)
+
+        assertThat(freshManager.authState.value).isEqualTo(AuthState.Unauthenticated)
+        assertThat(prefs.getString("uid", null)).isNull()
+    }
+
+    @Test
+    public fun `initial state handles null phoneLastFour in prefs gracefully`() {
+        // Covers the `prefs.getString(KEY_PHONE_LAST_FOUR, "") ?: ""` null branch
+        prefs
+            .edit()
+            .putString("uid", "uid-nophone")
+            // intentionally not setting phone_last_four — defaults to empty string
+            .putLong("session_created_at_epoch_ms", System.currentTimeMillis())
+            .apply()
+        val freshManager = SessionManager(prefs)
+
+        val state = freshManager.authState.value
+        assertThat(state).isInstanceOf(AuthState.Authenticated::class.java)
+        assertThat((state as AuthState.Authenticated).phoneLastFour).isEmpty()
+    }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/AuthOrchestratorTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/AuthOrchestratorTest.kt
new file mode 100644
index 0000000..58f914d
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/AuthOrchestratorTest.kt
@@ -0,0 +1,128 @@
+package com.homeservices.customer.domain.auth
+
+import android.content.Context
+import androidx.fragment.app.FragmentActivity
+import com.google.firebase.auth.FirebaseUser
+import com.google.firebase.auth.PhoneAuthCredential
+import com.google.firebase.auth.PhoneAuthProvider
+import com.homeservices.customer.domain.auth.model.AuthResult
+import com.homeservices.customer.domain.auth.model.OtpSendResult
+import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
+import io.mockk.coEvery
+import io.mockk.coVerify
+import io.mockk.every
+import io.mockk.mockk
+import io.mockk.verify
+import kotlinx.coroutines.flow.MutableSharedFlow
+import kotlinx.coroutines.flow.flowOf
+import kotlinx.coroutines.test.runTest
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.BeforeEach
+import org.junit.jupiter.api.Test
+
+public class AuthOrchestratorTest {
+    private lateinit var truecallerUseCase: TruecallerLoginUseCase
+    private lateinit var firebaseOtpUseCase: FirebaseOtpUseCase
+    private lateinit var saveSessionUseCase: SaveSessionUseCase
+    private lateinit var orchestrator: AuthOrchestrator
+
+    @BeforeEach
+    public fun setUp() {
+        truecallerUseCase = mockk(relaxed = true)
+        firebaseOtpUseCase = mockk(relaxed = true)
+        saveSessionUseCase = mockk(relaxed = true)
+        orchestrator = AuthOrchestrator(truecallerUseCase, firebaseOtpUseCase, saveSessionUseCase)
+    }
+
+    @Test
+    public fun `start returns TruecallerLaunched and calls launch when Truecaller is available`() {
+        val context = mockk<Context>()
+        val activity = mockk<FragmentActivity>()
+        every { truecallerUseCase.isAvailable() } returns true
+
+        val result = orchestrator.start(context, activity)
+
+        assertThat(result).isEqualTo(AuthOrchestrator.StartResult.TruecallerLaunched)
+        verify { truecallerUseCase.init(context) }
+        verify { truecallerUseCase.launch(activity) }
+    }
+
+    @Test
+    public fun `start returns FallbackToOtp when Truecaller is unavailable`() {
+        val context = mockk<Context>()
+        val activity = mockk<FragmentActivity>()
+        every { truecallerUseCase.isAvailable() } returns false
+
+        val result = orchestrator.start(context, activity)
+
+        assertThat(result).isEqualTo(AuthOrchestrator.StartResult.FallbackToOtp)
+        verify(exactly = 0) { truecallerUseCase.launch(any()) }
+    }
+
+    @Test
+    public fun `observeTruecallerResults returns flow from TruecallerLoginUseCase`() {
+        val sharedFlow = MutableSharedFlow<TruecallerAuthResult>()
+        every { truecallerUseCase.resultFlow } returns sharedFlow
+
+        val result = orchestrator.observeTruecallerResults()
+
+        assertThat(result).isSameAs(sharedFlow)
+    }
+
+    @Test
+    public fun `sendOtp delegates to FirebaseOtpUseCase`() {
+        val activity = mockk<FragmentActivity>()
+        val token = mockk<PhoneAuthProvider.ForceResendingToken>()
+        val expectedFlow = flowOf(OtpSendResult.CodeSent("vid", token))
+        every { firebaseOtpUseCase.sendOtp("+91123", activity, token) } returns expectedFlow
+
+        val result = orchestrator.sendOtp("+91123", activity, token)
+
+        assertThat(result).isSameAs(expectedFlow)
+    }
+
+    @Test
+    public fun `verifyOtp delegates to FirebaseOtpUseCase`() {
+        val expectedFlow = flowOf(AuthResult.Error.WrongCode)
+        every { firebaseOtpUseCase.verifyOtp("vid", "123456") } returns expectedFlow
+
+        val result = orchestrator.verifyOtp("vid", "123456")
+
+        assertThat(result).isSameAs(expectedFlow)
+    }
+
+    @Test
+    public fun `signInWithCredential delegates to FirebaseOtpUseCase`() {
+        val credential = mockk<PhoneAuthCredential>()
+        val user = mockk<FirebaseUser>()
+        val expectedFlow = flowOf(AuthResult.Success(user))
+        every { firebaseOtpUseCase.signInWithCredential(credential) } returns expectedFlow
+
+        val result = orchestrator.signInWithCredential(credential)
+
+        assertThat(result).isSameAs(expectedFlow)
+    }
+
+    @Test
+    public fun `completeWithTruecaller delegates to SaveSessionUseCase`(): Unit =
+        runTest {
+            val user = mockk<FirebaseUser>()
+            coEvery { saveSessionUseCase.saveAnonymousWithPhone("+91123") } returns AuthResult.Success(user)
+
+            val result = orchestrator.completeWithTruecaller("+91123")
+
+            assertThat(result).isInstanceOf(AuthResult.Success::class.java)
+            coVerify { saveSessionUseCase.saveAnonymousWithPhone("+91123") }
+        }
+
+    @Test
+    public fun `completeWithFirebase delegates to SaveSessionUseCase`(): Unit =
+        runTest {
+            val user = mockk<FirebaseUser> { every { uid } returns "uid-1" }
+            coEvery { saveSessionUseCase.save(user, "6789") } returns Unit
+
+            orchestrator.completeWithFirebase(user, "6789")
+
+            coVerify { saveSessionUseCase.save(user, "6789") }
+        }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCaseTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCaseTest.kt
new file mode 100644
index 0000000..3ad8f7a
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCaseTest.kt
@@ -0,0 +1,63 @@
+package com.homeservices.customer.domain.auth
+
+import android.content.Context
+import androidx.biometric.BiometricManager
+import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
+import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
+import io.mockk.every
+import io.mockk.mockk
+import io.mockk.mockkStatic
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.BeforeEach
+import org.junit.jupiter.api.Test
+
+public class BiometricGateUseCaseTest {
+    private lateinit var context: Context
+    private lateinit var biometricManager: BiometricManager
+    private lateinit var useCase: BiometricGateUseCase
+
+    @BeforeEach
+    public fun setUp() {
+        context = mockk()
+        biometricManager = mockk()
+        mockkStatic(BiometricManager::class)
+        every { BiometricManager.from(context) } returns biometricManager
+        useCase = BiometricGateUseCase()
+    }
+
+    @Test
+    public fun `canUseBiometric returns true when BiometricManager reports BIOMETRIC_SUCCESS`() {
+        every {
+            biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
+        } returns BiometricManager.BIOMETRIC_SUCCESS
+
+        assertThat(useCase.canUseBiometric(context)).isTrue()
+    }
+
+    @Test
+    public fun `canUseBiometric returns false when no hardware present`() {
+        every {
+            biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
+        } returns BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
+
+        assertThat(useCase.canUseBiometric(context)).isFalse()
+    }
+
+    @Test
+    public fun `canUseBiometric returns false when no biometric enrolled`() {
+        every {
+            biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
+        } returns BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED
+
+        assertThat(useCase.canUseBiometric(context)).isFalse()
+    }
+
+    @Test
+    public fun `canUseBiometric returns false when hardware unavailable`() {
+        every {
+            biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
+        } returns BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE
+
+        assertThat(useCase.canUseBiometric(context)).isFalse()
+    }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCaseTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCaseTest.kt
new file mode 100644
index 0000000..07cad67
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCaseTest.kt
@@ -0,0 +1,150 @@
+package com.homeservices.customer.domain.auth
+
+import com.google.android.gms.tasks.Tasks
+import com.google.firebase.auth.AuthResult
+import com.google.firebase.auth.FirebaseAuth
+import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
+import com.google.firebase.auth.FirebaseUser
+import com.google.firebase.auth.PhoneAuthCredential
+import io.mockk.every
+import io.mockk.mockk
+import kotlinx.coroutines.flow.first
+import kotlinx.coroutines.test.runTest
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.BeforeEach
+import org.junit.jupiter.api.Test
+import com.homeservices.customer.domain.auth.model.AuthResult as AppAuthResult
+
+public class FirebaseOtpUseCaseTest {
+    private lateinit var firebaseAuth: FirebaseAuth
+    private lateinit var useCase: FirebaseOtpUseCase
+
+    @BeforeEach
+    public fun setUp() {
+        firebaseAuth = mockk()
+        useCase = FirebaseOtpUseCase(firebaseAuth)
+    }
+
+    @Test
+    public fun `signInWithCredential emits Success when Firebase succeeds`(): Unit =
+        runTest {
+            val firebaseUser = mockk<FirebaseUser> { every { uid } returns "uid-123" }
+            val authResultMock = mockk<AuthResult> { every { user } returns firebaseUser }
+            val credential = mockk<PhoneAuthCredential>()
+
+            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forResult(authResultMock)
+
+            val result = useCase.signInWithCredential(credential).first()
+
+            assertThat(result).isInstanceOf(AppAuthResult.Success::class.java)
+            assertThat((result as AppAuthResult.Success).user.uid).isEqualTo("uid-123")
+        }
+
+    @Test
+    public fun `signInWithCredential emits WrongCode when Firebase throws invalid credentials`(): Unit =
+        runTest {
+            val credential = mockk<PhoneAuthCredential>()
+            val exception =
+                mockk<FirebaseAuthInvalidCredentialsException> {
+                    every { message } returns "ERROR_INVALID_VERIFICATION_CODE"
+                }
+
+            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)
+
+            val result = useCase.signInWithCredential(credential).first()
+
+            assertThat(result).isEqualTo(AppAuthResult.Error.WrongCode)
+        }
+
+    @Test
+    public fun `signInWithCredential emits General error for unexpected exceptions`(): Unit =
+        runTest {
+            val credential = mockk<PhoneAuthCredential>()
+            val exception = RuntimeException("network error")
+
+            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)
+
+            val result = useCase.signInWithCredential(credential).first()
+
+            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
+        }
+
+    @Test
+    public fun `signInWithCredential emits CodeExpired when message contains SESSION_EXPIRED`(): Unit =
+        runTest {
+            val credential = mockk<PhoneAuthCredential>()
+            val exception = RuntimeException("ERROR_SESSION_EXPIRED")
+
+            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)
+
+            val result = useCase.signInWithCredential(credential).first()
+
+            assertThat(result).isEqualTo(AppAuthResult.Error.CodeExpired)
+        }
+
+    @Test
+    public fun `signInWithCredential emits RateLimited when message contains TOO_MANY_REQUESTS`(): Unit =
+        runTest {
+            val credential = mockk<PhoneAuthCredential>()
+            val exception = RuntimeException("ERROR_TOO_MANY_REQUESTS")
+
+            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)
+
+            val result = useCase.signInWithCredential(credential).first()
+
+            assertThat(result).isEqualTo(AppAuthResult.Error.RateLimited)
+        }
+
+    @Test
+    public fun `signInWithCredential emits General error when user is null after success`(): Unit =
+        runTest {
+            val credential = mockk<PhoneAuthCredential>()
+            val authResultMock = mockk<AuthResult> { every { user } returns null }
+
+            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forResult(authResultMock)
+
+            val result = useCase.signInWithCredential(credential).first()
+
+            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
+        }
+
+    @Test
+    public fun `signInWithCredential emits General on FirebaseAuthInvalidCredentials with null message`(): Unit =
+        runTest {
+            // Covers the null-message branch: e.message?.contains(...) returns null (not true)
+            val credential = mockk<PhoneAuthCredential>()
+            val exception =
+                mockk<FirebaseAuthInvalidCredentialsException> {
+                    every { message } returns null // null message — falls through to General
+                }
+
+            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)
+
+            val result = useCase.signInWithCredential(credential).first()
+
+            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
+        }
+
+    @Test
+    public fun `verifyOtp delegates to signInWithCredential`(): Unit =
+        runTest {
+            // verifyOtp creates a credential and delegates — we can verify it returns a flow
+            // without throwing (PhoneAuthProvider.getCredential may throw in unit test, that's fine)
+            // We just verify the method path through delegation is exercised
+            val firebaseUser = mockk<FirebaseUser> { every { uid } returns "uid-verify" }
+            val authResultMock = mockk<AuthResult> { every { user } returns firebaseUser }
+            val credential = mockk<PhoneAuthCredential>()
+
+            // Mock PhoneAuthProvider static to return a credential — use relaxed mock on FirebaseAuth
+            every { firebaseAuth.signInWithCredential(any()) } returns Tasks.forResult(authResultMock)
+
+            // verifyOtp internally calls PhoneAuthProvider.getCredential which requires Firebase.
+            // If it throws, catch gracefully — the path is covered by signInWithCredential tests above.
+            try {
+                val result = useCase.verifyOtp("verificationId", "123456").first()
+                assertThat(result).isNotNull()
+            } catch (_: Exception) {
+                // Expected: PhoneAuthProvider.getCredential may fail in Robolectric without full Firebase init
+            }
+        }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCaseTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCaseTest.kt
new file mode 100644
index 0000000..7cc908d
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCaseTest.kt
@@ -0,0 +1,77 @@
+package com.homeservices.customer.domain.auth
+
+import com.google.android.gms.tasks.Tasks
+import com.google.firebase.FirebaseNetworkException
+import com.google.firebase.auth.AuthResult
+import com.google.firebase.auth.FirebaseAuth
+import com.google.firebase.auth.FirebaseUser
+import com.homeservices.customer.data.auth.SessionManager
+import io.mockk.coEvery
+import io.mockk.coVerify
+import io.mockk.every
+import io.mockk.mockk
+import kotlinx.coroutines.test.runTest
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.BeforeEach
+import org.junit.jupiter.api.Test
+import com.homeservices.customer.domain.auth.model.AuthResult as AppAuthResult
+
+public class SaveSessionUseCaseTest {
+    private lateinit var sessionManager: SessionManager
+    private lateinit var firebaseAuth: FirebaseAuth
+    private lateinit var useCase: SaveSessionUseCase
+
+    @BeforeEach
+    public fun setUp() {
+        sessionManager = mockk(relaxed = true)
+        firebaseAuth = mockk()
+        useCase = SaveSessionUseCase(sessionManager, firebaseAuth)
+    }
+
+    @Test
+    public fun `save stores uid and phoneLastFour in SessionManager`(): Unit =
+        runTest {
+            val user = mockk<FirebaseUser> { every { uid } returns "uid-abc" }
+            coEvery { sessionManager.saveSession(any(), any()) } returns Unit
+
+            useCase.save(user, "7890")
+
+            coVerify { sessionManager.saveSession("uid-abc", "7890") }
+        }
+
+    @Test
+    public fun `saveAnonymousWithPhone signs in anonymously and stores last 4 digits`(): Unit =
+        runTest {
+            val user = mockk<FirebaseUser> { every { uid } returns "anon-uid" }
+            val authResultMock = mockk<AuthResult> { every { this@mockk.user } returns user }
+            coEvery { sessionManager.saveSession(any(), any()) } returns Unit
+            every { firebaseAuth.signInAnonymously() } returns Tasks.forResult(authResultMock)
+
+            val result = useCase.saveAnonymousWithPhone("+919876541234")
+
+            assertThat(result).isInstanceOf(AppAuthResult.Success::class.java)
+            coVerify { sessionManager.saveSession("anon-uid", "1234") }
+        }
+
+    @Test
+    public fun `saveAnonymousWithPhone returns General error when Firebase throws`(): Unit =
+        runTest {
+            every { firebaseAuth.signInAnonymously() } returns Tasks.forException(FirebaseNetworkException("network fail"))
+
+            val result = useCase.saveAnonymousWithPhone("+919876541234")
+
+            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
+        }
+
+    @Test
+    public fun `saveAnonymousWithPhone returns General error when Firebase user is null`(): Unit =
+        runTest {
+            // Covers the `result.user ?: return AuthResult.Error.General(...)` null branch
+            val authResultMock = mockk<AuthResult> { every { this@mockk.user } returns null }
+            every { firebaseAuth.signInAnonymously() } returns Tasks.forResult(authResultMock)
+
+            val result = useCase.saveAnonymousWithPhone("+919876541234")
+
+            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
+        }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/TruecallerLoginUseCaseTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/TruecallerLoginUseCaseTest.kt
new file mode 100644
index 0000000..9ffcbad
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/TruecallerLoginUseCaseTest.kt
@@ -0,0 +1,63 @@
+package com.homeservices.customer.domain.auth
+
+import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
+import com.truecaller.android.sdk.common.models.TrueProfile
+import com.truecaller.android.sdk.legacy.TrueError
+import io.mockk.every
+import io.mockk.mockk
+import kotlinx.coroutines.flow.first
+import kotlinx.coroutines.test.runTest
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.BeforeEach
+import org.junit.jupiter.api.Test
+
+public class TruecallerLoginUseCaseTest {
+    private lateinit var useCase: TruecallerLoginUseCase
+
+    @BeforeEach
+    public fun setUp() {
+        useCase = TruecallerLoginUseCase()
+    }
+
+    @Test
+    public fun `emits Success with last 4 digits when SDK calls onSuccessProfileShared`(): Unit =
+        runTest {
+            val profile = TrueProfile.Builder("Test", "").build().also { it.phoneNumber = "+919876540000" }
+
+            useCase.simulateSdkCallback { callback ->
+                callback.onSuccessProfileShared(profile)
+            }
+
+            val result = useCase.resultFlow.first()
+            assertThat(result).isInstanceOf(TruecallerAuthResult.Success::class.java)
+            assertThat((result as TruecallerAuthResult.Success).phoneLastFour).isEqualTo("0000")
+        }
+
+    @Test
+    public fun `emits Cancelled when SDK calls onVerificationRequired`(): Unit =
+        runTest {
+            useCase.simulateSdkCallback { callback ->
+                callback.onVerificationRequired(null)
+            }
+
+            val result = useCase.resultFlow.first()
+            assertThat(result).isEqualTo(TruecallerAuthResult.Cancelled)
+        }
+
+    @Test
+    public fun `emits Failure with errorType when SDK calls onFailureProfileShared`(): Unit =
+        runTest {
+            val trueError =
+                mockk<TrueError> {
+                    every { errorType } returns 404
+                }
+
+            useCase.simulateSdkCallback { callback ->
+                callback.onFailureProfileShared(trueError)
+            }
+
+            val result = useCase.resultFlow.first()
+            assertThat(result).isInstanceOf(TruecallerAuthResult.Failure::class.java)
+            assertThat((result as TruecallerAuthResult.Failure).errorType).isEqualTo(404)
+        }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthScreenPaparazziTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthScreenPaparazziTest.kt
new file mode 100644
index 0000000..25c3d79
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthScreenPaparazziTest.kt
@@ -0,0 +1,216 @@
+package com.homeservices.customer.ui.auth
+
+import app.cash.paparazzi.DeviceConfig
+import app.cash.paparazzi.Paparazzi
+import com.homeservices.designsystem.theme.HomeservicesTheme
+import org.junit.Rule
+import org.junit.Test
+
+public class AuthScreenPaparazziTest {
+    @get:Rule
+    public val paparazzi: Paparazzi =
+        Paparazzi(
+            deviceConfig = DeviceConfig.PIXEL_5,
+            theme = "android:Theme.Material3.DayNight.NoActionBar",
+        )
+
+    @Test
+    public fun truecallerLoadingState_lightTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AuthScreen(
+                    uiState = AuthUiState.TruecallerLoading,
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun truecallerLoadingState_darkTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = true) {
+                AuthScreen(
+                    uiState = AuthUiState.TruecallerLoading,
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun phoneEntryState_lightTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AuthScreen(
+                    uiState = AuthUiState.OtpEntry(phoneNumber = "", verificationId = null),
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun phoneEntryState_darkTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = true) {
+                AuthScreen(
+                    uiState = AuthUiState.OtpEntry(phoneNumber = "", verificationId = null),
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun errorState_lightTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AuthScreen(
+                    uiState =
+                        AuthUiState.Error(
+                            message = "Incorrect code",
+                            retriesLeft = 2,
+                        ),
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun errorState_darkTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = true) {
+                AuthScreen(
+                    uiState =
+                        AuthUiState.Error(
+                            message = "Incorrect code",
+                            retriesLeft = 2,
+                        ),
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun idleState_lightTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AuthScreen(
+                    uiState = AuthUiState.Idle,
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun otpCodeEntryState_lightTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AuthScreen(
+                    uiState =
+                        AuthUiState.OtpEntry(
+                            phoneNumber = "+919876543210",
+                            verificationId = "ver-id-123",
+                        ),
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun otpSendingState_lightTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AuthScreen(
+                    uiState = AuthUiState.OtpSending,
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun otpVerifyingState_lightTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AuthScreen(
+                    uiState = AuthUiState.OtpVerifying,
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun errorStateNoRetries_lightTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AuthScreen(
+                    uiState =
+                        AuthUiState.Error(
+                            message = "Too many attempts. Try again later.",
+                            retriesLeft = 0,
+                        ),
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun errorStateOneRetry_lightTheme() {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AuthScreen(
+                    uiState =
+                        AuthUiState.Error(
+                            message = "Incorrect code",
+                            retriesLeft = 1,
+                        ),
+                    onPhoneSubmitted = {},
+                    onOtpEntered = {},
+                    onResendRequested = {},
+                    onRetry = {},
+                )
+            }
+        }
+    }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthViewModelTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthViewModelTest.kt
new file mode 100644
index 0000000..dd89524
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthViewModelTest.kt
@@ -0,0 +1,374 @@
+package com.homeservices.customer.ui.auth
+
+import androidx.fragment.app.FragmentActivity
+import com.google.firebase.auth.FirebaseUser
+import com.google.firebase.auth.PhoneAuthCredential
+import com.google.firebase.auth.PhoneAuthProvider
+import com.homeservices.customer.domain.auth.AuthOrchestrator
+import com.homeservices.customer.domain.auth.model.AuthResult
+import com.homeservices.customer.domain.auth.model.OtpSendResult
+import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
+import io.mockk.coEvery
+import io.mockk.every
+import io.mockk.mockk
+import kotlinx.coroutines.Dispatchers
+import kotlinx.coroutines.ExperimentalCoroutinesApi
+import kotlinx.coroutines.flow.MutableSharedFlow
+import kotlinx.coroutines.flow.flowOf
+import kotlinx.coroutines.test.UnconfinedTestDispatcher
+import kotlinx.coroutines.test.resetMain
+import kotlinx.coroutines.test.runTest
+import kotlinx.coroutines.test.setMain
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.AfterEach
+import org.junit.jupiter.api.BeforeEach
+import org.junit.jupiter.api.Test
+
+@OptIn(ExperimentalCoroutinesApi::class)
+public class AuthViewModelTest {
+    private lateinit var orchestrator: AuthOrchestrator
+    private lateinit var viewModel: AuthViewModel
+    private val truecallerResultFlow = MutableSharedFlow<TruecallerAuthResult>(extraBufferCapacity = 1)
+    private val testDispatcher = UnconfinedTestDispatcher()
+
+    @BeforeEach
+    public fun setUp() {
+        Dispatchers.setMain(testDispatcher)
+        orchestrator = mockk(relaxed = true)
+        every { orchestrator.observeTruecallerResults() } returns truecallerResultFlow
+        viewModel = AuthViewModel(orchestrator)
+    }
+
+    @AfterEach
+    public fun tearDown() {
+        Dispatchers.resetMain()
+    }
+
+    @Test
+    public fun `initial uiState is Idle`() {
+        assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.Idle)
+    }
+
+    @Test
+    public fun `initAuth transitions to TruecallerLoading when Truecaller is available`(): Unit =
+        runTest {
+            val activity = mockk<FragmentActivity>()
+            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched
+
+            viewModel.initAuth(activity)
+
+            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.TruecallerLoading)
+        }
+
+    @Test
+    public fun `initAuth transitions to OtpEntry when Truecaller is unavailable`(): Unit =
+        runTest {
+            val activity = mockk<FragmentActivity>()
+            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.FallbackToOtp
+
+            viewModel.initAuth(activity)
+
+            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
+        }
+
+    @Test
+    public fun `Truecaller Cancelled result transitions to OtpEntry`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched
+
+            viewModel.initAuth(activity)
+            truecallerResultFlow.emit(TruecallerAuthResult.Cancelled)
+
+            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
+        }
+
+    @Test
+    public fun `Truecaller Failure result transitions to OtpEntry`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched
+
+            viewModel.initAuth(activity)
+            truecallerResultFlow.emit(TruecallerAuthResult.Failure(errorType = 5))
+
+            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
+        }
+
+    @Test
+    public fun `Truecaller Success with AuthResult Error transitions to Error state`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched
+            coEvery { orchestrator.completeWithTruecaller("0000") } returns
+                AuthResult.Error.General(RuntimeException("session fail"))
+
+            viewModel.initAuth(activity)
+            truecallerResultFlow.emit(TruecallerAuthResult.Success("0000"))
+
+            val state = viewModel.uiState.value
+            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
+            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(0)
+        }
+
+    @Test
+    public fun `onPhoneNumberSubmitted transitions to OtpEntry on CodeSent`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+
+            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
+            assertThat((viewModel.uiState.value as AuthUiState.OtpEntry).verificationId)
+                .isEqualTo("verId")
+        }
+
+    @Test
+    public fun `onPhoneNumberSubmitted handles OtpSendResult Error`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.Error(RuntimeException("network")))
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+
+            val state = viewModel.uiState.value
+            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
+            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(3)
+        }
+
+    @Test
+    public fun `onPhoneNumberSubmitted handles AutoVerified result`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val credential = mockk<PhoneAuthCredential>()
+            val user = mockk<FirebaseUser> { every { uid } returns "uid-auto" }
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.AutoVerified(credential))
+            every {
+                orchestrator.signInWithCredential(credential)
+            } returns flowOf(AuthResult.Success(user))
+            coEvery { orchestrator.completeWithFirebase(user, "3210") } returns Unit
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+
+            // After AutoVerified + Success, completeWithFirebase is called (state may stay as is)
+            // The key assertion is no error state is set
+            assertThat(viewModel.uiState.value).isNotInstanceOf(AuthUiState.Error::class.java)
+        }
+
+    @Test
+    public fun `onOtpEntered does nothing when verificationId is null`(): Unit =
+        runTest {
+            // No prior sendOtp, so verificationId is null — onOtpEntered should be a no-op
+            viewModel.onOtpEntered("123456")
+
+            assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.Idle)
+        }
+
+    @Test
+    public fun `onOtpEntered transitions to Error with WrongCode`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
+            every {
+                orchestrator.verifyOtp("verId", "000000")
+            } returns flowOf(AuthResult.Error.WrongCode)
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+            viewModel.onOtpEntered("000000")
+
+            val state = viewModel.uiState.value
+            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
+            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(2)
+        }
+
+    @Test
+    public fun `onOtpEntered handles RateLimited error`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
+            every {
+                orchestrator.verifyOtp("verId", "000000")
+            } returns flowOf(AuthResult.Error.RateLimited)
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+            viewModel.onOtpEntered("000000")
+
+            val state = viewModel.uiState.value
+            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
+            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(0)
+        }
+
+    @Test
+    public fun `onOtpEntered handles CodeExpired error`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
+            every {
+                orchestrator.verifyOtp("verId", "000000")
+            } returns flowOf(AuthResult.Error.CodeExpired)
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+            viewModel.onOtpEntered("000000")
+
+            val state = viewModel.uiState.value
+            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
+            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(0)
+        }
+
+    @Test
+    public fun `onOtpEntered handles General error`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
+            every {
+                orchestrator.verifyOtp("verId", "000000")
+            } returns flowOf(AuthResult.Error.General(RuntimeException("unknown")))
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+            viewModel.onOtpEntered("000000")
+
+            val state = viewModel.uiState.value
+            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
+            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(0)
+        }
+
+    @Test
+    public fun `onOtpEntered handles Cancelled result`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
+            every {
+                orchestrator.verifyOtp("verId", "000000")
+            } returns flowOf(AuthResult.Cancelled)
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+            viewModel.onOtpEntered("000000")
+
+            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
+        }
+
+    @Test
+    public fun `onOtpEntered handles Success result`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            val user = mockk<FirebaseUser> { every { uid } returns "uid-success" }
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
+            every {
+                orchestrator.verifyOtp("verId", "123456")
+            } returns flowOf(AuthResult.Success(user))
+            coEvery { orchestrator.completeWithFirebase(user, "3210") } returns Unit
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+            viewModel.onOtpEntered("123456")
+
+            // Success: completeWithFirebase was called, no error state
+            assertThat(viewModel.uiState.value).isNotInstanceOf(AuthUiState.Error::class.java)
+        }
+
+    @Test
+    public fun `onOtpResendRequested resets attempts and re-sends OTP`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            every {
+                orchestrator.sendOtp(any(), activity, any())
+            } returns flowOf(OtpSendResult.CodeSent("newVerId", resendToken))
+
+            // First submit to set currentPhoneNumber
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+            // Now resend
+            viewModel.onOtpResendRequested(activity)
+
+            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
+            assertThat((viewModel.uiState.value as AuthUiState.OtpEntry).verificationId)
+                .isEqualTo("newVerId")
+        }
+
+    @Test
+    public fun `onRetry resets state to OtpEntry`(): Unit =
+        runTest {
+            viewModel.onRetry()
+
+            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
+        }
+
+    @Test
+    public fun `Truecaller Success with AuthResult Success does not transition to Error`(): Unit =
+        runTest(testDispatcher) {
+            // Covers the false-branch of `if (authResult is AuthResult.Error)` in handleTruecallerResult
+            val activity = mockk<FragmentActivity>()
+            val user = mockk<FirebaseUser>()
+            every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched
+            coEvery { orchestrator.completeWithTruecaller("0000") } returns AuthResult.Success(user)
+
+            viewModel.initAuth(activity)
+            truecallerResultFlow.emit(TruecallerAuthResult.Success("0000"))
+
+            assertThat(viewModel.uiState.value).isNotInstanceOf(AuthUiState.Error::class.java)
+        }
+
+    @Test
+    public fun `onOtpEntered handles General error shows generic message`(): Unit =
+        runTest(testDispatcher) {
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
+            every {
+                orchestrator.verifyOtp("verId", "000000")
+            } returns flowOf(AuthResult.Error.General(RuntimeException("internal sdk error")))
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+            viewModel.onOtpEntered("000000")
+
+            val state = viewModel.uiState.value
+            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
+            assertThat((state as AuthUiState.Error).message).isEqualTo("Sign-in failed. Please try again.")
+        }
+
+    @Test
+    public fun `onOtpEntered handles Unavailable result`(): Unit =
+        runTest(testDispatcher) {
+            // Covers the `is AuthResult.Unavailable` branch in handleFirebaseAuthResult
+            val activity = mockk<FragmentActivity>()
+            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
+            every {
+                orchestrator.sendOtp("+919876543210", activity, null)
+            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
+            every {
+                orchestrator.verifyOtp("verId", "000000")
+            } returns flowOf(AuthResult.Unavailable)
+
+            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
+            viewModel.onOtpEntered("000000")
+
+            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
+        }
+}
diff --git a/customer-app/app/src/test/snapshots/images/com.homeservices.customer.ui_SmokeScreenPaparazziTest_smokeScreenDarkThemeMatchesSnapshot.png b/customer-app/app/src/test/snapshots/images/com.homeservices.customer.ui_SmokeScreenPaparazziTest_smokeScreenDarkThemeMatchesSnapshot.png
deleted file mode 100644
index 634be8a..0000000
Binary files a/customer-app/app/src/test/snapshots/images/com.homeservices.customer.ui_SmokeScreenPaparazziTest_smokeScreenDarkThemeMatchesSnapshot.png and /dev/null differ
diff --git a/customer-app/app/src/test/snapshots/images/com.homeservices.customer.ui_SmokeScreenPaparazziTest_smokeScreenLightThemeMatchesSnapshot.png b/customer-app/app/src/test/snapshots/images/com.homeservices.customer.ui_SmokeScreenPaparazziTest_smokeScreenLightThemeMatchesSnapshot.png
deleted file mode 100644
index 10797a3..0000000
Binary files a/customer-app/app/src/test/snapshots/images/com.homeservices.customer.ui_SmokeScreenPaparazziTest_smokeScreenLightThemeMatchesSnapshot.png and /dev/null differ
diff --git a/customer-app/build.gradle.kts b/customer-app/build.gradle.kts
index 4f87a48..efbada4 100644
--- a/customer-app/build.gradle.kts
+++ b/customer-app/build.gradle.kts
@@ -9,4 +9,5 @@ plugins {
     alias(libs.plugins.paparazzi) apply false
     alias(libs.plugins.kover) apply false
     alias(libs.plugins.android.junit5) apply false
+    alias(libs.plugins.google.services) apply false
 }
diff --git a/customer-app/detekt.yml b/customer-app/detekt.yml
index 4ca3270..c5ddfe1 100644
--- a/customer-app/detekt.yml
+++ b/customer-app/detekt.yml
@@ -6,6 +6,12 @@ config:
   validation: true
 
 style:
+  MaxLineLength:
+    active: true
+    maxLineLength: 140
+    excludePackageStatements: true
+    excludeImportStatements: true
+    excludeCommentStatements: false
   MagicNumber:
     active: true
     ignoreNumbers: ['-1', '0', '1', '2']
@@ -48,3 +54,5 @@ naming:
   FunctionMaxLength:
     active: true
     maximumFunctionNameLength: 60
+    # Backtick test names routinely exceed 60 chars — suppress in test sources
+    excludes: ['**/test/**', '**/androidTest/**']
diff --git a/customer-app/gradle/libs.versions.toml b/customer-app/gradle/libs.versions.toml
index b27f099..e272b14 100644
--- a/customer-app/gradle/libs.versions.toml
+++ b/customer-app/gradle/libs.versions.toml
@@ -6,6 +6,9 @@ agp = "8.6.0"
 java = "21"
 
 # AndroidX / Compose
+androidxBiometric = "1.1.0"
+androidxNavigationCompose = "2.8.9"
+androidxSecurityCrypto = "1.0.0"
 coreKtx = "1.15.0"
 activityCompose = "1.9.3"
 lifecycleViewmodelCompose = "2.8.7"
@@ -15,9 +18,16 @@ hiltNavigationCompose = "1.2.0"
 # DI
 hilt = "2.52"
 
+# Firebase
+firebaseBom = "33.9.0"
+googleServices = "4.4.2"
+
 # Observability
 sentry = "7.17.0"
 
+# Third-party auth (Maven Central: latest stable; 3.0.3 never published, using 3.2.1)
+truecallerSdk = "3.2.1"
+
 # Build-time / Dev
 ktlint = "12.1.1"
 detekt = "1.23.7"
@@ -26,6 +36,8 @@ kover = "0.9.0"
 androidJunit5 = "1.11.2.0"
 
 # Test
+coroutines = "1.8.1"
+coroutinesTest = "1.8.1"
 junit5 = "5.11.3"
 mockk = "1.13.13"
 assertj = "3.26.3"
@@ -38,9 +50,12 @@ androidxTestRunner = "1.6.2"
 homeservices-design-system = { module = "com.homeservices:design-system", version = "0.1.0" }
 
 # AndroidX
+androidx-biometric = { module = "androidx.biometric:biometric", version.ref = "androidxBiometric" }
 androidx-core-ktx = { module = "androidx.core:core-ktx", version.ref = "coreKtx" }
 androidx-activity-compose = { module = "androidx.activity:activity-compose", version.ref = "activityCompose" }
 androidx-lifecycle-viewmodel-compose = { module = "androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "lifecycleViewmodelCompose" }
+androidx-navigation-compose = { module = "androidx.navigation:navigation-compose", version.ref = "androidxNavigationCompose" }
+androidx-security-crypto = { module = "androidx.security:security-crypto", version.ref = "androidxSecurityCrypto" }
 
 # Compose (BOM-pinned — no version)
 compose-bom = { module = "androidx.compose:compose-bom", version.ref = "composeBom" }
@@ -55,9 +70,16 @@ hilt-compiler = { module = "com.google.dagger:hilt-android-compiler", version.re
 hilt-testing = { module = "com.google.dagger:hilt-android-testing", version.ref = "hilt" }
 androidx-hilt-navigation-compose = { module = "androidx.hilt:hilt-navigation-compose", version.ref = "hiltNavigationCompose" }
 
+# Firebase (BOM-pinned — firebase-auth-ktx has no explicit version)
+firebase-bom = { module = "com.google.firebase:firebase-bom", version.ref = "firebaseBom" }
+firebase-auth-ktx = { module = "com.google.firebase:firebase-auth-ktx" }
+
 # Observability
 sentry-android = { module = "io.sentry:sentry-android", version.ref = "sentry" }
 
+# Third-party auth (Maven Central)
+truecaller-sdk = { module = "com.truecaller.android.sdk:truecaller-sdk", version.ref = "truecallerSdk" }
+
 # Test
 junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit5" }
 junit-jupiter-api = { module = "org.junit.jupiter:junit-jupiter-api", version.ref = "junit5" }
@@ -69,6 +91,8 @@ assertj-core = { module = "org.assertj:assertj-core", version.ref = "assertj" }
 robolectric = { module = "org.robolectric:robolectric", version.ref = "robolectric" }
 androidx-test-core = { module = "androidx.test:core", version.ref = "androidxTestCore" }
 androidx-test-runner = { module = "androidx.test:runner", version.ref = "androidxTestRunner" }
+kotlinx-coroutines-play-services = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-play-services", version.ref = "coroutines" }
+kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "coroutinesTest" }
 
 [plugins]
 android-application = { id = "com.android.application", version.ref = "agp" }
@@ -81,3 +105,4 @@ detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
 paparazzi = { id = "app.cash.paparazzi", version.ref = "paparazzi" }
 kover = { id = "org.jetbrains.kotlinx.kover", version.ref = "kover" }
 android-junit5 = { id = "de.mannodermaus.android-junit5", version.ref = "androidJunit5" }
+google-services = { id = "com.google.gms.google-services", version.ref = "googleServices" }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only 550d2dd8ab3d571ee16ef2338736a531ea96af9b' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 357ms:
.gitignore
customer-app/app/build.gradle.kts
customer-app/app/google-services.json
customer-app/app/proguard-rules.pro
customer-app/app/src/main/AndroidManifest.xml
customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionManager.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthModule.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthPrefs.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/AuthOrchestrator.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCase.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/TruecallerLoginUseCase.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthResult.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthState.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/BiometricResult.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/OtpSendResult.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/TruecallerAuthResult.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AuthGraph.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthUiState.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/home/HomeScreen.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionManagerTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/AuthOrchestratorTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCaseTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCaseTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCaseTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/TruecallerLoginUseCaseTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthScreenPaparazziTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthViewModelTest.kt
customer-app/app/src/test/snapshots/images/com.homeservices.customer.ui_SmokeScreenPaparazziTest_smokeScreenDarkThemeMatchesSnapshot.png
customer-app/app/src/test/snapshots/images/com.homeservices.customer.ui_SmokeScreenPaparazziTest_smokeScreenLightThemeMatchesSnapshot.png
customer-app/build.gradle.kts
customer-app/detekt.yml
customer-app/gradle/libs.versions.toml

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path 'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt'; echo '---'; Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/TruecallerLoginUseCase.kt'; echo '---'; Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt'" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 504ms:
package com.homeservices.customer.domain.auth

import android.app.Activity
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class FirebaseOtpUseCase
    @Inject
    constructor(
        private val firebaseAuth: FirebaseAuth,
    ) {
        private companion object {
            const val OTP_TIMEOUT_SECONDS = 60L
        }

        public fun sendOtp(
            phoneNumber: String,
            activity: Activity,
            resendToken: PhoneAuthProvider.ForceResendingToken? = null,
        ): Flow<OtpSendResult> =
            callbackFlow {
                val callbacks =
                    object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
                        override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                            trySend(OtpSendResult.AutoVerified(credential))
                            close()
                        }

                        override fun onVerificationFailed(e: FirebaseException) {
                            trySend(OtpSendResult.Error(e))
                            close()
                        }

                        override fun onCodeSent(
                            verificationId: String,
                            token: PhoneAuthProvider.ForceResendingToken,
                        ) {
                            trySend(OtpSendResult.CodeSent(verificationId, token))
                            // channel stays open â€” awaiting auto-verify or user code submission
                        }
                    }

                val optionsBuilder =
                    PhoneAuthOptions
                        .newBuilder(firebaseAuth)
                        .setPhoneNumber(phoneNumber)
                        .setTimeout(OTP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                        .setActivity(activity)
                        .setCallbacks(callbacks)

                resendToken?.let { optionsBuilder.setForceResendingToken(it) }

                PhoneAuthProvider.verifyPhoneNumber(optionsBuilder.build())
                awaitClose()
            }

        public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> =
            callbackFlow {
                val executor = java.util.concurrent.Executor { it.run() }
                firebaseAuth
                    .signInWithCredential(credential)
                    .addOnSuccessListener(executor) { result ->
                        val user = result.user
                        if (user != null) {
                            trySend(AuthResult.Success(user))
                        } else {
                            trySend(AuthResult.Error.General(IllegalStateException("null user after sign-in")))
                        }
                        close()
                    }.addOnFailureListener(executor) { e ->
                        val mapped =
                            when {
                                e is FirebaseAuthInvalidCredentialsException &&
                                    e.message?.contains("ERROR_INVALID_VERIFICATION_CODE") == true ->
                                    AuthResult.Error.WrongCode

                                e.message?.contains("ERROR_SESSION_EXPIRED") == true ->
                                    AuthResult.Error.CodeExpired

                                e.message?.contains("ERROR_TOO_MANY_REQUESTS") == true ->
                                    AuthResult.Error.RateLimited

                                else -> AuthResult.Error.General(e)
                            }
                        trySend(mapped)
                        close()
                    }
                awaitClose()
            }

        public fun verifyOtp(
            verificationId: String,
            code: String,
        ): Flow<AuthResult> {
            val credential = PhoneAuthProvider.getCredential(verificationId, code)
            return signInWithCredential(credential)
        }
    }
---
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

        // TruecallerSDK.getInstance() throws IllegalStateException if not yet initialised â€”
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

        // TruecallerSDK.getInstance() throws if SDK not yet initialised â€” graceful degradation to OTP.
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
---
package com.homeservices.customer.ui.auth

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.customer.domain.auth.AuthOrchestrator
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class AuthViewModel
    @Inject
    constructor(
        private val orchestrator: AuthOrchestrator,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
        public val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

        private companion object {
            const val MAX_OTP_RETRIES = 3
            const val PHONE_LAST_DIGITS = 4
        }

        private var currentVerificationId: String? = null
        private var currentResendToken: PhoneAuthProvider.ForceResendingToken? = null
        private var currentPhoneNumber: String = ""
        private var otpAttempts: Int = 0

        public fun initAuth(activity: FragmentActivity) {
            // FragmentActivity IS-A Context; pass it for both the Context and FragmentActivity params
            when (orchestrator.start(activity, activity)) {
                AuthOrchestrator.StartResult.TruecallerLaunched -> {
                    _uiState.value = AuthUiState.TruecallerLoading
                    viewModelScope.launch {
                        orchestrator.observeTruecallerResults().collect { result ->
                            handleTruecallerResult(result)
                        }
                    }
                }
                AuthOrchestrator.StartResult.FallbackToOtp -> {
                    _uiState.value = AuthUiState.OtpEntry()
                }
            }
        }

        private fun handleTruecallerResult(result: TruecallerAuthResult) {
            when (result) {
                is TruecallerAuthResult.Success -> {
                    viewModelScope.launch {
                        val authResult = orchestrator.completeWithTruecaller(result.phoneLastFour)
                        if (authResult is AuthResult.Error) {
                            _uiState.value =
                                AuthUiState.Error(
                                    message = "Sign-in failed. Please use OTP.",
                                    retriesLeft = 0,
                                )
                        }
                    }
                }
                is TruecallerAuthResult.Failure, TruecallerAuthResult.Cancelled -> {
                    _uiState.value = AuthUiState.OtpEntry()
                }
            }
        }

        public fun onPhoneNumberSubmitted(
            phoneNumber: String,
            activity: FragmentActivity,
            resendToken: PhoneAuthProvider.ForceResendingToken? = null,
        ) {
            currentPhoneNumber = phoneNumber
            _uiState.value = AuthUiState.OtpSending
            viewModelScope.launch {
                orchestrator.sendOtp(phoneNumber, activity, resendToken).collect { result ->
                    when (result) {
                        is OtpSendResult.CodeSent -> {
                            currentVerificationId = result.verificationId
                            currentResendToken = result.resendToken
                            _uiState.value =
                                AuthUiState.OtpEntry(
                                    phoneNumber = phoneNumber,
                                    verificationId = result.verificationId,
                                )
                        }
                        is OtpSendResult.AutoVerified -> {
                            orchestrator.signInWithCredential(result.credential).collect { authResult ->
                                handleFirebaseAuthResult(authResult)
                            }
                        }
                        is OtpSendResult.Error -> {
                            _uiState.value =
                                AuthUiState.Error(
                                    message = "Failed to send OTP. Check your number and connection.",
                                    retriesLeft = MAX_OTP_RETRIES,
                                )
                        }
                    }
                }
            }
        }

        public fun onOtpEntered(code: String) {
            val verificationId = currentVerificationId ?: return
            _uiState.value = AuthUiState.OtpVerifying
            viewModelScope.launch {
                orchestrator.verifyOtp(verificationId, code).collect { result ->
                    handleFirebaseAuthResult(result)
                }
            }
        }

        public fun onOtpResendRequested(activity: FragmentActivity) {
            otpAttempts = 0
            onPhoneNumberSubmitted(currentPhoneNumber, activity, currentResendToken)
        }

        public fun onRetry() {
            otpAttempts = 0
            currentVerificationId = null
            currentResendToken = null
            _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
        }

        private suspend fun handleFirebaseAuthResult(result: AuthResult) {
            when (result) {
                is AuthResult.Success -> {
                    orchestrator.completeWithFirebase(result.user, currentPhoneNumber.takeLast(PHONE_LAST_DIGITS))
                }
                is AuthResult.Error.WrongCode -> {
                    otpAttempts++
                    _uiState.value =
                        AuthUiState.Error(
                            message = "Incorrect code",
                            retriesLeft = maxOf(0, MAX_OTP_RETRIES - otpAttempts),
                        )
                }
                is AuthResult.Error.RateLimited ->
                    _uiState.value = AuthUiState.Error("Too many attempts. Try again later.", retriesLeft = 0)
                is AuthResult.Error.CodeExpired ->
                    _uiState.value = AuthUiState.Error("Code expired. Please resend.", retriesLeft = 0)
                is AuthResult.Error.General ->
                    _uiState.value =
                        AuthUiState.Error(
                            "Sign-in failed. Please try again.",
                            retriesLeft = 0,
                        )
                is AuthResult.Cancelled, is AuthResult.Unavailable ->
                    _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
            }
        }
    }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt'; echo '---'; Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AuthGraph.kt'; echo '---'; Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt'; echo '---'; Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt'" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 461ms:
package com.homeservices.customer.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.rememberNavController
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthState

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    modifier: Modifier = Modifier,
) {
    val navController = rememberNavController()
    val authState by sessionManager.authState.collectAsStateWithLifecycle()

    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.Authenticated ->
                navController.navigate("main") {
                    popUpTo("auth") { inclusive = true }
                    launchSingleTop = true
                }
            is AuthState.Unauthenticated ->
                navController.navigate("auth") {
                    popUpTo("main") { inclusive = true }
                    launchSingleTop = true
                }
        }
    }

    NavHost(
        navController = navController,
        startDestination = "auth",
        modifier = modifier,
    ) {
        authGraph(navController, activity)
        mainGraph()
    }
}
---
package com.homeservices.customer.navigation

import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import androidx.navigation.navigation
import com.homeservices.customer.ui.auth.AuthScreen
import com.homeservices.customer.ui.auth.AuthViewModel

// navController will be used in E02-S02 when navigating to HomeGraph on successful auth
@Suppress("UnusedParameter")
internal fun NavGraphBuilder.authGraph(
    navController: NavController,
    activity: FragmentActivity,
) {
    navigation(startDestination = "auth_screen", route = "auth") {
        composable("auth_screen") {
            val viewModel: AuthViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()

            LaunchedEffect(Unit) {
                viewModel.initAuth(activity)
            }

            AuthScreen(
                uiState = uiState,
                onPhoneSubmitted = { phone -> viewModel.onPhoneNumberSubmitted(phone, activity) },
                onOtpEntered = viewModel::onOtpEntered,
                onResendRequested = { viewModel.onOtpResendRequested(activity) },
                onRetry = viewModel::onRetry,
            )
        }
    }
}
---
package com.homeservices.customer.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

private const val PHONE_LAST_DIGITS = 4

@Composable
internal fun AuthScreen(
    uiState: AuthUiState,
    onPhoneSubmitted: (String) -> Unit,
    onOtpEntered: (String) -> Unit,
    onResendRequested: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        when (uiState) {
            is AuthUiState.Idle, is AuthUiState.TruecallerLoading ->
                TruecallerLoadingContent()

            is AuthUiState.OtpEntry -> {
                if (uiState.verificationId == null) {
                    PhoneEntryContent(
                        initialPhone = uiState.phoneNumber,
                        onPhoneSubmitted = onPhoneSubmitted,
                    )
                } else {
                    OtpCodeContent(
                        phoneNumber = uiState.phoneNumber,
                        onOtpEntered = onOtpEntered,
                        onResendRequested = onResendRequested,
                    )
                }
            }

            is AuthUiState.OtpSending ->
                LoadingContent(message = "Sending OTP\u2026")

            is AuthUiState.OtpVerifying ->
                LoadingContent(message = "Verifying\u2026")

            is AuthUiState.Error ->
                ErrorContent(state = uiState, onRetry = onRetry)
        }
    }
}

@Composable
private fun TruecallerLoadingContent() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Verifying with Truecaller\u2026",
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun PhoneEntryContent(
    initialPhone: String,
    onPhoneSubmitted: (String) -> Unit,
) {
    var phone by remember { mutableStateOf(initialPhone) }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Enter your mobile number",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "We\u2019ll send a one-time code to verify your number",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(32.dp))
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            label = { Text("Mobile number") },
            placeholder = { Text("+91 98765 43210") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "By continuing, you agree to our Terms of Service and Privacy Policy.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = { onPhoneSubmitted(phone.trim()) },
            enabled = phone.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Get OTP")
        }
    }
}

@Composable
private fun OtpCodeContent(
    phoneNumber: String,
    onOtpEntered: (String) -> Unit,
    onResendRequested: () -> Unit,
) {
    var otp by remember { mutableStateOf("") }
    val lastFour = phoneNumber.takeLast(PHONE_LAST_DIGITS).ifEmpty { "your number" }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Enter the code we sent to \u2022\u2022\u2022\u2022$lastFour",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(32.dp))
        OutlinedTextField(
            value = otp,
            onValueChange = { if (it.length <= 6) otp = it },
            label = { Text("6-digit code") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = { onOtpEntered(otp.trim()) },
            enabled = otp.length == 6,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Verify")
        }
        Spacer(modifier = Modifier.height(8.dp))
        TextButton(onClick = onResendRequested) {
            Text("Resend code")
        }
    }
}

@Composable
private fun LoadingContent(message: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = message, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun ErrorContent(
    state: AuthUiState.Error,
    onRetry: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = state.message,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center,
        )
        if (state.retriesLeft > 0) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "${state.retriesLeft} attempt${if (state.retriesLeft == 1) "" else "s"} remaining",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
            Text("Try again")
        }
    }
}
---
package com.homeservices.customer.domain.auth

import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthResult
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

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content 'customer-app/app/build.gradle.kts'" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 279ms:
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ktlint)
    alias(libs.plugins.detekt)
    alias(libs.plugins.paparazzi)
    alias(libs.plugins.kover)
    alias(libs.plugins.android.junit5)
    alias(libs.plugins.google.services)
}

android {
    namespace = "com.homeservices.customer"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.homeservices.customer"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "com.homeservices.customer.TestRunner"

        buildConfigField(
            "String",
            "SENTRY_DSN",
            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
        )
        buildConfigField(
            "String",
            "GIT_SHA",
            "\"${System.getenv("GIT_SHA") ?: "dev"}\"",
        )
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            // TODO(deploy-story): enable minification before Play Store submission â€” skeleton intentionally disabled
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "/META-INF/LICENSE*"
        }
    }

    sourceSets {
        getByName("main").kotlin.srcDirs("src/main/kotlin")
        getByName("test").kotlin.srcDirs("src/test/kotlin")
        getByName("androidTest").kotlin.srcDirs("src/androidTest/kotlin")
    }

    lint {
        warningsAsErrors = true
        checkDependencies = false
        abortOnError = true
        checkReleaseBuilds = false
        // Story E01-S03 pins specific versions (AGP 8.6.0, targetSdk 35, etc.) per architecture
        // decision. Suppress advisory "newer version available" checks to avoid false failures.
        // LintError suppresses internal lint FIR crash (AGP 8.6.0 + K2 known issue on unit-test supertype resolution)
        disable += setOf("OldTargetApi", "AndroidGradlePluginVersion", "GradleDependency", "LintError")
    }

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
        }
    }
}

kotlin {
    jvmToolchain(
        libs.versions.java
            .get()
            .toInt(),
    )
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
        freeCompilerArgs.addAll(
            "-Xexplicit-api=strict",
            "-Xjsr305=strict",
        )
    }
}

ktlint {
    version.set("1.3.1")
    android.set(true)
    ignoreFailures.set(false)
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.CHECKSTYLE)
    }
}

detekt {
    toolVersion = libs.versions.detekt.get()
    config.setFrom(file("../detekt.yml"))
    buildUponDefaultConfig = true
    allRules = false
    autoCorrect = false
    ignoreFailures = false
}

kover {
    reports {
        verify {
            rule {
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.LINE)
                // Branch coverage threshold is intentionally lower than line/instruction because:
                // 1. Compose UI files generate synthetic internal branches (recomposition guards,
                //    slot-table ops) that are only exercisable via Compose instrumented tests,
                //    not JVM unit tests. Paparazzi snapshot tests cover the UI rendering paths.
                // 2. Firebase SDK callbackFlow bodies (PhoneAuthProvider callbacks) are framework
                //    callbacks that require a live Firebase project to trigger.
                // 3. Android BiometricPrompt callback branches require a real device/emulator.
                // CI's Espresso/Compose instrumented tests (run in a later story) will cover
                // the remaining UI and framework integration branches.
                minBound(70, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.BRANCH)
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.INSTRUCTION)
            }
        }
        filters {
            excludes {
                classes(
                    // Hilt & Dagger generated code
                    "*.Hilt_*",
                    "*.*_Factory",
                    "*.*_Factory\$*",
                    "*.*_Factory\$InstanceHolder",
                    "*.*_HiltModules*",
                    "*.*_HiltModules\$*",
                    "*.*_Impl",
                    "*.*_MembersInjector",
                    "*.*_GeneratedInjector",
                    "hilt_aggregated_deps.*",
                    "dagger.hilt.*",
                    // KSP-generated factories (pattern: ModuleName_ProvideXxxFactory)
                    "*.*_Provide*Factory*",
                    // Compose-generated lambdas & singletons
                    "*.ComposableSingletons*",
                    "*.ComposableSingletons\$*",
                    // Android/Build generated
                    "*.BuildConfig",
                    "*.R",
                    "*.R\$*",
                    // Excluded application entry-points (no unit tests possible without emulator)
                    "*.HomeservicesCustomerApplication",
                    "*.MainActivity",
                    "*.MainActivity\$*",
                    "*.TestRunner",
                    // Compose theme boilerplate (Color / Theme / Type) â€” framework wiring, not business logic
                    "*.ui.theme.*",
                    // Compose navigation graphs â€” NavHost lambdas are framework wiring, not unit-testable
                    "*.navigation.*",
                    // Hilt DI module â€” @Provides methods are framework wiring
                    "*.data.auth.di.*",
                    // Stub home screen â€” placeholder Compose composable, no logic
                    "*.ui.home.*",
                    // BiometricGateUseCase.requestAuth requires FragmentActivity + BiometricPrompt
                    // (Android OS framework calls), not unit-testable without instrumentation
                    "*.BiometricGateUseCase",
                    // Compose screen files generate *Kt JVM wrapper classes. The top-level class
                    // contains Compose-framework branches (recomposition guards, slot-table ops)
                    // that are only exercisable via Compose instrumented tests (Paparazzi covers
                    // the nested $AuthScreen$1 lambda which holds the actual when-branches).
                    "*.AuthScreenKt",
                    // FirebaseOtpUseCase.sendOtp uses callbackFlow with PhoneAuthProvider â€”
                    // a real Firebase SDK callback that can't be triggered in JVM unit tests.
                    // signInWithCredential branches are tested separately.
                    "*.FirebaseOtpUseCase",
                )
            }
        }
    }
}

// Hilt + KSP2 (K2 compiler): pass the flag that tells the Hilt KSP processor
// that the Hilt Gradle plugin IS applied and superclass validation should be
// skipped during the KSP pass (the plugin does the bytecode transform post-compile).
// Without this, KSP2 fails with "Expected @AndroidEntryPoint to have a value".
// See https://dagger.dev/hilt/gradle-setup.html#ksp
ksp {
    arg("dagger.hilt.android.internal.disableAndroidSuperclassValidation", "true")
}

// Paparazzi 1.3.5 picks up the correct layoutlib for the Compose BOM automatically.
// No paparazzi {} configuration block is needed or valid.

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.compose.material3)
    implementation(libs.homeservices.design.system)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    implementation(libs.sentry.android)

    // Firebase (BOM manages all Firebase library versions)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth.ktx)

    // Coroutines â€” play-services extensions (.await() on Task<T>)
    implementation(libs.kotlinx.coroutines.play.services)

    // Auth SDKs
    implementation(libs.truecaller.sdk)
    implementation(libs.androidx.security.crypto)
    implementation(libs.androidx.biometric)
    implementation(libs.androidx.navigation.compose)

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.junit.jupiter.api)
    testRuntimeOnly(libs.junit.jupiter.engine)
    // JUnit 4 vintage engine: required for Paparazzi @Rule-based tests under the JUnit 5 launcher
    testRuntimeOnly(libs.junit.vintage.engine)
    testImplementation(libs.mockk)
    testImplementation(libs.assertj.core)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(libs.hilt.testing)
    testImplementation(libs.kotlinx.coroutines.test)
    kspTest(libs.hilt.compiler)

    androidTestImplementation(libs.hilt.testing)
    androidTestImplementation(libs.androidx.test.runner)
    kspAndroidTest(libs.hilt.compiler)
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'customer-app/app/src/main/kotlin' -Filter *.kt | Select-String -Pattern 'collectAsStateWithLifecycle|lifecycle.runtime.compose'" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 511ms:

customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:8:import 
androidx.lifecycle.compose.collectAsStateWithLifecycle
customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:21:    val authState by 
sessionManager.authState.collectAsStateWithLifecycle()
customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AuthGraph.kt:7:import 
androidx.lifecycle.compose.collectAsStateWithLifecycle
customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AuthGraph.kt:24:            val uiState by 
viewModel.uiState.collectAsStateWithLifecycle()



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthUiState.kt'; echo '---'; Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthResult.kt'; echo '---'; Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/OtpSendResult.kt'; echo '---'; Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt'; echo '---'; Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/ui/home/HomeScreen.kt'" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 6963ms:
package com.homeservices.customer.ui.auth

public sealed class AuthUiState {
    public data object Idle : AuthUiState()

    public data object TruecallerLoading : AuthUiState()

    public data class OtpEntry(
        val phoneNumber: String = "",
        val verificationId: String? = null,
    ) : AuthUiState()

    public data object OtpSending : AuthUiState()

    public data object OtpVerifying : AuthUiState()

    public data class Error(
        val message: String,
        val retriesLeft: Int,
    ) : AuthUiState()
}
---
package com.homeservices.customer.domain.auth.model

import com.google.firebase.auth.FirebaseUser

public sealed class AuthResult {
    public data class Success(
        val user: FirebaseUser,
    ) : AuthResult()

    public data object Cancelled : AuthResult()

    public data object Unavailable : AuthResult()

    public sealed class Error : AuthResult() {
        public data class General(
            val cause: Throwable,
        ) : Error()

        public data object RateLimited : Error()

        public data object WrongCode : Error()

        public data object CodeExpired : Error()
    }
}
---
package com.homeservices.customer.domain.auth.model

import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider

public sealed class OtpSendResult {
    public data class CodeSent(
        val verificationId: String,
        val resendToken: PhoneAuthProvider.ForceResendingToken,
    ) : OtpSendResult()

    public data class AutoVerified(
        val credential: PhoneAuthCredential,
    ) : OtpSendResult()

    public data class Error(
        val cause: Throwable,
    ) : OtpSendResult()
}
---
package com.homeservices.customer.navigation

import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import androidx.navigation.navigation
import com.homeservices.customer.ui.home.HomeScreen

internal fun NavGraphBuilder.mainGraph() {
    navigation(startDestination = "home", route = "main") {
        composable("home") {
            HomeScreen()
        }
    }
}
---
package com.homeservices.customer.ui.home

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
internal fun HomeScreen(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "Home â€” coming soon",
                style = MaterialTheme.typography.bodyLarge,
            )
        }
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat 550d2dd8ab3d571ee16ef2338736a531ea96af9b' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 494ms:
 .gitignore                                         |   3 +
 customer-app/app/build.gradle.kts                  |  45 ++-
 customer-app/app/google-services.json              |  29 ++
 customer-app/app/proguard-rules.pro                |   8 +
 customer-app/app/src/main/AndroidManifest.xml      |   5 +
 .../com/homeservices/customer/MainActivity.kt      |  40 ++-
 .../customer/data/auth/SessionManager.kt           |  70 ++++
 .../customer/data/auth/di/AuthModule.kt            |  37 ++
 .../customer/data/auth/di/AuthPrefs.kt             |   7 +
 .../customer/domain/auth/AuthOrchestrator.kt       |  66 ++++
 .../customer/domain/auth/BiometricGateUseCase.kt   |  85 +++++
 .../customer/domain/auth/FirebaseOtpUseCase.kt     | 111 ++++++
 .../customer/domain/auth/SaveSessionUseCase.kt     |  48 +++
 .../customer/domain/auth/TruecallerLoginUseCase.kt |  71 ++++
 .../customer/domain/auth/model/AuthResult.kt       |  25 ++
 .../customer/domain/auth/model/AuthState.kt        |  10 +
 .../customer/domain/auth/model/BiometricResult.kt  |  11 +
 .../customer/domain/auth/model/OtpSendResult.kt    |  19 ++
 .../domain/auth/model/TruecallerAuthResult.kt      |  13 +
 .../customer/navigation/AppNavigation.kt           |  46 +++
 .../homeservices/customer/navigation/AuthGraph.kt  |  39 +++
 .../homeservices/customer/navigation/MainGraph.kt  |  14 +
 .../homeservices/customer/ui/auth/AuthScreen.kt    | 234 +++++++++++++
 .../homeservices/customer/ui/auth/AuthUiState.kt   |  21 ++
 .../homeservices/customer/ui/auth/AuthViewModel.kt | 159 +++++++++
 .../homeservices/customer/ui/home/HomeScreen.kt    |  28 ++
 .../customer/data/auth/SessionManagerTest.kt       | 117 +++++++
 .../customer/domain/auth/AuthOrchestratorTest.kt   | 128 +++++++
 .../domain/auth/BiometricGateUseCaseTest.kt        |  63 ++++
 .../customer/domain/auth/FirebaseOtpUseCaseTest.kt | 150 +++++++++
 .../customer/domain/auth/SaveSessionUseCaseTest.kt |  77 +++++
 .../domain/auth/TruecallerLoginUseCaseTest.kt      |  63 ++++
 .../customer/ui/auth/AuthScreenPaparazziTest.kt    | 216 ++++++++++++
 .../customer/ui/auth/AuthViewModelTest.kt          | 374 +++++++++++++++++++++
 ...zziTest_smokeScreenDarkThemeMatchesSnapshot.png | Bin 20606 -> 0 bytes
 ...ziTest_smokeScreenLightThemeMatchesSnapshot.png | Bin 22064 -> 0 bytes
 customer-app/build.gradle.kts                      |   1 +
 customer-app/detekt.yml                            |   8 +
 customer-app/gradle/libs.versions.toml             |  25 ++
 39 files changed, 2459 insertions(+), 7 deletions(-)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content 'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCase.kt'" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 449ms:
package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.model.BiometricResult
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import kotlin.coroutines.resume

public class BiometricGateUseCase
    @Inject
    constructor() {
        public fun canUseBiometric(context: Context): Boolean =
            BiometricManager
                .from(context)
                .canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL) ==
                BiometricManager.BIOMETRIC_SUCCESS

        /**
         * Shows a biometric prompt and suspends until the user authenticates, cancels, or an error
         * occurs. Caller should check [canUseBiometric] first â€” if false, skip this call entirely.
         *
         * Usage in future ViewModels:
         * ```
         * if (biometricGate.canUseBiometric(context)) {
         *     val result = biometricGate.requestAuth(activity, "Confirm Booking", "Use biometric")
         *     if (result !is BiometricResult.Authenticated) return
         * }
         * // proceed with sensitive action
         * ```
         */
        public suspend fun requestAuth(
            activity: FragmentActivity,
            title: String,
            subtitle: String,
        ): BiometricResult =
            suspendCancellableCoroutine { continuation ->
                val executor = ContextCompat.getMainExecutor(activity)

                val callback =
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                            if (continuation.isActive) continuation.resume(BiometricResult.Authenticated)
                        }

                        override fun onAuthenticationError(
                            errorCode: Int,
                            errString: CharSequence,
                        ) {
                            if (!continuation.isActive) return
                            val mapped =
                                when (errorCode) {
                                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> BiometricResult.Lockout
                                    BiometricPrompt.ERROR_HW_NOT_PRESENT,
                                    BiometricPrompt.ERROR_HW_UNAVAILABLE,
                                    BiometricPrompt.ERROR_NO_BIOMETRICS,
                                    BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL,
                                    -> BiometricResult.HardwareAbsent
                                    else -> BiometricResult.Cancelled
                                }
                            continuation.resume(mapped)
                        }

                        override fun onAuthenticationFailed() = Unit
                    }

                val promptInfo =
                    BiometricPrompt.PromptInfo
                        .Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle)
                        .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
                        .build()

                val prompt = BiometricPrompt(activity, executor, callback)
                prompt.authenticate(promptInfo)

                continuation.invokeOnCancellation { prompt.cancelAuthentication() }
            }
    }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --check 550d2dd8ab3d571ee16ef2338736a531ea96af9b' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 396ms:
2026-04-19T18:41:02.378971Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content '"'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt' | ForEach-Object { '{0,4}: {1}' -f "'$i, $_; $i++ }; echo '"'---'; "'$i=1; Get-Content '"'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt' | ForEach-Object { '{0,4}: {1}' -f "'$i, $_; $i++ }'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content '"'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt' | ForEach-Object { '{0,4}: {1}' -f "'$i, $_; $i++ }; echo '"'---'; "'$i=1; Get-Content '"'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt' | ForEach-Object { '{0,4}: {1}' -f "'$i, $_; $i++ }' in C:\Alok\Business Projects\Urbanclap-dup
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content '"'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt' | ForEach-Object { '{0,4}: {1}' -f "'$i, $_; $i++ }; echo '"'---'; "'$i=1; Get-Content '"'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt' | ForEach-Object { '{0,4}: {1}' -f "'$i, $_; $i++ }'` rejected: blocked by policy
2026-04-19T18:41:06.277855Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "python - <<'PY'
from pathlib import Path
for p in ['customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt']:
 print('---',p)
 for i,line in enumerate(Path(p).read_text().splitlines(),1):
  print(f'{i:4}: {line}')
PY"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "python - <<'PY'
from pathlib import Path
for p in ['customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt']:
 print('---',p)
 for i,line in enumerate(Path(p).read_text().splitlines(),1):
  print(f'{i:4}: {line}')
PY" in C:\Alok\Business Projects\Urbanclap-dup
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "python - <<'PY'
from pathlib import Path
for p in ['customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCase.kt']:
 print('---',p)
 for i,line in enumerate(Path(p).read_text().splitlines(),1):
  print(f'{i:4}: {line}')
PY"` rejected: blocked by policy
2026-04-19T18:41:09.975074Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content -LiteralPath '"'customer-app\\app\\src\\main\\kotlin\\com\\homeservices\\customer\\navigation\\AppNavigation.kt' | ForEach-Object { "'$i = $i + 1; Write-Output ($i.ToString() + '"': ' + "'$_) }'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content -LiteralPath '"'customer-app\\app\\src\\main\\kotlin\\com\\homeservices\\customer\\navigation\\AppNavigation.kt' | ForEach-Object { "'$i = $i + 1; Write-Output ($i.ToString() + '"': ' + "'$_) }' in C:\Alok\Business Projects\Urbanclap-dup
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content -LiteralPath '"'customer-app\\app\\src\\main\\kotlin\\com\\homeservices\\customer\\navigation\\AppNavigation.kt' | ForEach-Object { "'$i = $i + 1; Write-Output ($i.ToString() + '"': ' + "'$_) }'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'findstr /n "''^" "customer-app'"\\app\\src\\main\\kotlin\\com\\homeservices\\customer\\navigation\\AppNavigation.kt\"" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 303ms:
1:package com.homeservices.customer.navigation
2:
3:import androidx.compose.runtime.Composable
4:import androidx.compose.runtime.LaunchedEffect
5:import androidx.compose.runtime.getValue
6:import androidx.compose.ui.Modifier
7:import androidx.fragment.app.FragmentActivity
8:import androidx.lifecycle.compose.collectAsStateWithLifecycle
9:import androidx.navigation.compose.NavHost
10:import androidx.navigation.compose.rememberNavController
11:import com.homeservices.customer.data.auth.SessionManager
12:import com.homeservices.customer.domain.auth.model.AuthState
13:
14:@Composable
15:internal fun AppNavigation(
16:    sessionManager: SessionManager,
17:    activity: FragmentActivity,
18:    modifier: Modifier = Modifier,
19:) {
20:    val navController = rememberNavController()
21:    val authState by sessionManager.authState.collectAsStateWithLifecycle()
22:
23:    LaunchedEffect(authState) {
24:        when (authState) {
25:            is AuthState.Authenticated ->
26:                navController.navigate("main") {
27:                    popUpTo("auth") { inclusive = true }
28:                    launchSingleTop = true
29:                }
30:            is AuthState.Unauthenticated ->
31:                navController.navigate("auth") {
32:                    popUpTo("main") { inclusive = true }
33:                    launchSingleTop = true
34:                }
35:        }
36:    }
37:
38:    NavHost(
39:        navController = navController,
40:        startDestination = "auth",
41:        modifier = modifier,
42:    ) {
43:        authGraph(navController, activity)
44:        mainGraph()
45:    }
46:}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'findstr /n "''^" "customer-app'"\\app\\src\\main\\kotlin\\com\\homeservices\\customer\\domain\\auth\\FirebaseOtpUseCase.kt\"" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 417ms:
1:package com.homeservices.customer.domain.auth
2:
3:import android.app.Activity
4:import com.google.firebase.FirebaseException
5:import com.google.firebase.auth.FirebaseAuth
6:import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
7:import com.google.firebase.auth.PhoneAuthCredential
8:import com.google.firebase.auth.PhoneAuthOptions
9:import com.google.firebase.auth.PhoneAuthProvider
10:import com.homeservices.customer.domain.auth.model.AuthResult
11:import com.homeservices.customer.domain.auth.model.OtpSendResult
12:import kotlinx.coroutines.channels.awaitClose
13:import kotlinx.coroutines.flow.Flow
14:import kotlinx.coroutines.flow.callbackFlow
15:import java.util.concurrent.TimeUnit
16:import javax.inject.Inject
17:import javax.inject.Singleton
18:
19:@Singleton
20:public class FirebaseOtpUseCase
21:    @Inject
22:    constructor(
23:        private val firebaseAuth: FirebaseAuth,
24:    ) {
25:        private companion object {
26:            const val OTP_TIMEOUT_SECONDS = 60L
27:        }
28:
29:        public fun sendOtp(
30:            phoneNumber: String,
31:            activity: Activity,
32:            resendToken: PhoneAuthProvider.ForceResendingToken? = null,
33:        ): Flow<OtpSendResult> =
34:            callbackFlow {
35:                val callbacks =
36:                    object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
37:                        override fun onVerificationCompleted(credential: PhoneAuthCredential) {
38:                            trySend(OtpSendResult.AutoVerified(credential))
39:                            close()
40:                        }
41:
42:                        override fun onVerificationFailed(e: FirebaseException) {
43:                            trySend(OtpSendResult.Error(e))
44:                            close()
45:                        }
46:
47:                        override fun onCodeSent(
48:                            verificationId: String,
49:                            token: PhoneAuthProvider.ForceResendingToken,
50:                        ) {
51:                            trySend(OtpSendResult.CodeSent(verificationId, token))
52:                            // channel stays open — awaiting auto-verify or user code submission
53:                        }
54:                    }
55:
56:                val optionsBuilder =
57:                    PhoneAuthOptions
58:                        .newBuilder(firebaseAuth)
59:                        .setPhoneNumber(phoneNumber)
60:                        .setTimeout(OTP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
61:                        .setActivity(activity)
62:                        .setCallbacks(callbacks)
63:
64:                resendToken?.let { optionsBuilder.setForceResendingToken(it) }
65:
66:                PhoneAuthProvider.verifyPhoneNumber(optionsBuilder.build())
67:                awaitClose()
68:            }
69:
70:        public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> =
71:            callbackFlow {
72:                val executor = java.util.concurrent.Executor { it.run() }
73:                firebaseAuth
74:                    .signInWithCredential(credential)
75:                    .addOnSuccessListener(executor) { result ->
76:                        val user = result.user
77:                        if (user != null) {
78:                            trySend(AuthResult.Success(user))
79:                        } else {
80:                            trySend(AuthResult.Error.General(IllegalStateException("null user after sign-in")))
81:                        }
82:                        close()
83:                    }.addOnFailureListener(executor) { e ->
84:                        val mapped =
85:                            when {
86:                                e is FirebaseAuthInvalidCredentialsException &&
87:                                    e.message?.contains("ERROR_INVALID_VERIFICATION_CODE") == true ->
88:                                    AuthResult.Error.WrongCode
89:
90:                                e.message?.contains("ERROR_SESSION_EXPIRED") == true ->
91:                                    AuthResult.Error.CodeExpired
92:
93:                                e.message?.contains("ERROR_TOO_MANY_REQUESTS") == true ->
94:                                    AuthResult.Error.RateLimited
95:
96:                                else -> AuthResult.Error.General(e)
97:                            }
98:                        trySend(mapped)
99:                        close()
100:                    }
101:                awaitClose()
102:            }
103:
104:        public fun verifyOtp(
105:            verificationId: String,
106:            code: String,
107:        ): Flow<AuthResult> {
108:            val credential = PhoneAuthProvider.getCredential(verificationId, code)
109:            return signInWithCredential(credential)
110:        }
111:    }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "findstr /n \"lifecycle\\|navigation\\|dependencies\" \"customer-app\\app\\build.gradle.kts\"" in C:\Alok\Business Projects\Urbanclap-dup
2026-04-19T18:41:25.585889Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.3 seconds
Output:

 exited 1 in 317ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "findstr /n /c:\"lifecycle\" /c:\"navigation\" /c:\"dependencies\" \"customer-app\\app\\build.gradle.kts\"" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 283ms:
181:                    // Compose navigation graphs — NavHost lambdas are framework wiring, not unit-testable
182:                    "*.navigation.*",
217:dependencies {
220:    implementation(libs.androidx.lifecycle.viewmodel.compose)
231:    implementation(libs.androidx.hilt.navigation.compose)
246:    implementation(libs.androidx.navigation.compose)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content 'customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/FirebaseOtpUseCaseTest.kt'" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 374ms:
package com.homeservices.customer.domain.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import com.homeservices.customer.domain.auth.model.AuthResult as AppAuthResult

public class FirebaseOtpUseCaseTest {
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var useCase: FirebaseOtpUseCase

    @BeforeEach
    public fun setUp() {
        firebaseAuth = mockk()
        useCase = FirebaseOtpUseCase(firebaseAuth)
    }

    @Test
    public fun `signInWithCredential emits Success when Firebase succeeds`(): Unit =
        runTest {
            val firebaseUser = mockk<FirebaseUser> { every { uid } returns "uid-123" }
            val authResultMock = mockk<AuthResult> { every { user } returns firebaseUser }
            val credential = mockk<PhoneAuthCredential>()

            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forResult(authResultMock)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isInstanceOf(AppAuthResult.Success::class.java)
            assertThat((result as AppAuthResult.Success).user.uid).isEqualTo("uid-123")
        }

    @Test
    public fun `signInWithCredential emits WrongCode when Firebase throws invalid credentials`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()
            val exception =
                mockk<FirebaseAuthInvalidCredentialsException> {
                    every { message } returns "ERROR_INVALID_VERIFICATION_CODE"
                }

            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isEqualTo(AppAuthResult.Error.WrongCode)
        }

    @Test
    public fun `signInWithCredential emits General error for unexpected exceptions`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()
            val exception = RuntimeException("network error")

            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }

    @Test
    public fun `signInWithCredential emits CodeExpired when message contains SESSION_EXPIRED`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()
            val exception = RuntimeException("ERROR_SESSION_EXPIRED")

            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isEqualTo(AppAuthResult.Error.CodeExpired)
        }

    @Test
    public fun `signInWithCredential emits RateLimited when message contains TOO_MANY_REQUESTS`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()
            val exception = RuntimeException("ERROR_TOO_MANY_REQUESTS")

            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isEqualTo(AppAuthResult.Error.RateLimited)
        }

    @Test
    public fun `signInWithCredential emits General error when user is null after success`(): Unit =
        runTest {
            val credential = mockk<PhoneAuthCredential>()
            val authResultMock = mockk<AuthResult> { every { user } returns null }

            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forResult(authResultMock)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }

    @Test
    public fun `signInWithCredential emits General on FirebaseAuthInvalidCredentials with null message`(): Unit =
        runTest {
            // Covers the null-message branch: e.message?.contains(...) returns null (not true)
            val credential = mockk<PhoneAuthCredential>()
            val exception =
                mockk<FirebaseAuthInvalidCredentialsException> {
                    every { message } returns null // null message â€” falls through to General
                }

            every { firebaseAuth.signInWithCredential(credential) } returns Tasks.forException(exception)

            val result = useCase.signInWithCredential(credential).first()

            assertThat(result).isInstanceOf(AppAuthResult.Error.General::class.java)
        }

    @Test
    public fun `verifyOtp delegates to signInWithCredential`(): Unit =
        runTest {
            // verifyOtp creates a credential and delegates â€” we can verify it returns a flow
            // without throwing (PhoneAuthProvider.getCredential may throw in unit test, that's fine)
            // We just verify the method path through delegation is exercised
            val firebaseUser = mockk<FirebaseUser> { every { uid } returns "uid-verify" }
            val authResultMock = mockk<AuthResult> { every { user } returns firebaseUser }
            val credential = mockk<PhoneAuthCredential>()

            // Mock PhoneAuthProvider static to return a credential â€” use relaxed mock on FirebaseAuth
            every { firebaseAuth.signInWithCredential(any()) } returns Tasks.forResult(authResultMock)

            // verifyOtp internally calls PhoneAuthProvider.getCredential which requires Firebase.
            // If it throws, catch gracefully â€” the path is covered by signInWithCredential tests above.
            try {
                val result = useCase.verifyOtp("verificationId", "123456").first()
                assertThat(result).isNotNull()
            } catch (_: Exception) {
                // Expected: PhoneAuthProvider.getCredential may fail in Robolectric without full Firebase init
            }
        }
}

codex
The patch introduces new lifecycle-aware Compose APIs without the required lifecycle-runtime-compose dependency, which is expected to break a clean build. There are also OTP flow handling issues that can leak active verification collectors and misclassify common Firebase auth errors.

Full review comments:

- [P1] Add lifecycle-runtime-compose for lifecycle state collection — C:\Alok\Business Projects\Urbanclap-dup\customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:8-8
  These new composables import and call `collectAsStateWithLifecycle`, but the patch does not add `androidx.lifecycle:lifecycle-runtime-compose` to the app dependencies. `lifecycle-viewmodel-compose` does not provide this API, so a clean compile of the new navigation/auth screens will fail with an unresolved reference until the runtime-compose artifact is added.

- [P2] Close the OTP flow after auto-retrieval timeout — C:\Alok\Business Projects\Urbanclap-dup\customer-app\app\src\main\kotlin\com\homeservices\customer\domain\auth\FirebaseOtpUseCase.kt:51-52
  For users who receive `CodeSent` and then manually enter the OTP or request a resend, this `callbackFlow` never closes because `onCodeAutoRetrievalTimeOut` is not overridden and the ViewModel does not cancel the collection. Each send/resend leaves a coroutine and Firebase callback active for the lifetime of the ViewModel, and stale callbacks can still update auth state later; close the channel on timeout or cancel the prior send job when moving to manual verification/resend.

- [P2] Use Firebase error codes for OTP failures — C:\Alok\Business Projects\Urbanclap-dup\customer-app\app\src\main\kotlin\com\homeservices\customer\domain\auth\FirebaseOtpUseCase.kt:86-94
  When Firebase rejects a wrong or expired SMS code, the stable value is exposed as `FirebaseAuthException.errorCode`; the human-readable `message` is not guaranteed to contain strings like `ERROR_INVALID_VERIFICATION_CODE` and may be localized. In those cases this falls through to `General`, so users get the wrong message/retry handling for common OTP failures.
The patch introduces new lifecycle-aware Compose APIs without the required lifecycle-runtime-compose dependency, which is expected to break a clean build. There are also OTP flow handling issues that can leak active verification collectors and misclassify common Firebase auth errors.

Full review comments:

- [P1] Add lifecycle-runtime-compose for lifecycle state collection — C:\Alok\Business Projects\Urbanclap-dup\customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:8-8
  These new composables import and call `collectAsStateWithLifecycle`, but the patch does not add `androidx.lifecycle:lifecycle-runtime-compose` to the app dependencies. `lifecycle-viewmodel-compose` does not provide this API, so a clean compile of the new navigation/auth screens will fail with an unresolved reference until the runtime-compose artifact is added.

- [P2] Close the OTP flow after auto-retrieval timeout — C:\Alok\Business Projects\Urbanclap-dup\customer-app\app\src\main\kotlin\com\homeservices\customer\domain\auth\FirebaseOtpUseCase.kt:51-52
  For users who receive `CodeSent` and then manually enter the OTP or request a resend, this `callbackFlow` never closes because `onCodeAutoRetrievalTimeOut` is not overridden and the ViewModel does not cancel the collection. Each send/resend leaves a coroutine and Firebase callback active for the lifetime of the ViewModel, and stale callbacks can still update auth state later; close the channel on timeout or cancel the prior send job when moving to manual verification/resend.

- [P2] Use Firebase error codes for OTP failures — C:\Alok\Business Projects\Urbanclap-dup\customer-app\app\src\main\kotlin\com\homeservices\customer\domain\auth\FirebaseOtpUseCase.kt:86-94
  When Firebase rejects a wrong or expired SMS code, the stable value is exposed as `FirebaseAuthException.errorCode`; the human-readable `message` is not guaranteed to contain strings like `ERROR_INVALID_VERIFICATION_CODE` and may be localized. In those cases this falls through to `General`, so users get the wrong message/retry handling for common OTP failures.
