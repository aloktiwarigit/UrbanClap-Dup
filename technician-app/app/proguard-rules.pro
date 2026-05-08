# Truecaller SDK
-keep class com.truecaller.android.sdk.** { *; }
-dontwarn com.truecaller.android.sdk.**

# Firebase Auth
-keep class com.google.firebase.auth.** { *; }
-dontwarn com.google.firebase.auth.**

# Security-crypto (EncryptedSharedPreferences)
-keep class androidx.security.crypto.** { *; }

# Credential Manager + Google Identity Library
-keep class androidx.credentials.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }
-keep class com.google.firebase.auth.GoogleAuthProvider { *; }
-keep class com.google.firebase.auth.FirebaseAuthUserCollisionException { *; }

# Razorpay SDK (mirrored for safety — technician-app does not process payments)
-keep class com.razorpay.** { *; }
-keep class proguard.annotation.** { *; }
-keepattributes JavascriptInterface
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-dontwarn com.razorpay.**

# Google Maps + Places SDK
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.libraries.places.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.google.android.libraries.places.**

# Google Maps Compose
-keep class com.google.maps.android.** { *; }

# Moshi + Kotlin codegen
-keep @com.squareup.moshi.JsonClass class * { *; }
-keep class * extends com.squareup.moshi.JsonAdapter { *; }
-keepclassmembers class * { @com.squareup.moshi.Json <fields>; }

# Coil image loading
-dontwarn coil.**

# Play Integrity (already has reflection via SDK)
-keep class com.google.android.play.core.integrity.** { *; }
-dontwarn com.google.android.play.core.integrity.**

# OkHttp / Retrofit
-dontwarn okhttp3.**
-dontwarn retrofit2.**
# Retrofit services are instantiated through dynamic proxies. Keep the app's
# service interfaces and members so release shrinking cannot remove or rewrite
# methods that Retrofit needs to inspect at runtime.
-keep,allowobfuscation interface com.homeservices.technician.**.*ApiService { *; }

# Sentry
-dontwarn io.sentry.**

# Keepattributes for reflection
-keepattributes Signature
-keepattributes *Annotation*

# GrowthBook SDK
-keep class com.sdk.growthbook.** { *; }
-dontwarn com.sdk.growthbook.**
