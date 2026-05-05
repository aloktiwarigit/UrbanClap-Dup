# Truecaller SDK — SDK classes use reflection; must not be renamed or removed
-keep class com.truecaller.android.sdk.** { *; }
-dontwarn com.truecaller.android.sdk.**

# Firebase Auth — required for phone auth credential classes
-keepattributes Signature
-keepattributes *Annotation*

# Credential Manager + Google Identity Library
-keep class androidx.credentials.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }
# Firebase Google auth provider
-keep class com.google.firebase.auth.GoogleAuthProvider { *; }
-keep class com.google.firebase.auth.FirebaseAuthUserCollisionException { *; }

# Razorpay SDK (customer-app payment flow)
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

# Sentry
-dontwarn io.sentry.**

# GrowthBook SDK
-keep class com.sdk.growthbook.** { *; }
-dontwarn com.sdk.growthbook.**
