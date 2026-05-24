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
# Retrofit service interfaces — explicit keeps (wildcard removed for security)
-keep interface com.homeservices.technician.data.activeJob.ActiveJobApiService { *; }
-keep interface com.homeservices.technician.data.availability.remote.TechnicianAvailabilityApiService { *; }
-keep interface com.homeservices.technician.data.complaint.remote.ComplaintApiService { *; }
-keep interface com.homeservices.technician.data.earnings.remote.EarningsApiService { *; }
-keep interface com.homeservices.technician.data.erasure.remote.ErasureApiService { *; }
-keep interface com.homeservices.technician.data.integrity.IntegrityApiService { *; }
-keep interface com.homeservices.technician.data.jobOffer.JobOfferApiService { *; }
-keep interface com.homeservices.technician.data.jobs.remote.TechnicianJobsApiService { *; }
-keep interface com.homeservices.technician.data.payout.remote.PayoutApiService { *; }
-keep interface com.homeservices.technician.data.photo.PhotoApiService { *; }
-keep interface com.homeservices.technician.data.rating.remote.RatingApiService { *; }
-keep interface com.homeservices.technician.data.serviceprofile.remote.ServiceProfileApiService { *; }
-keep interface com.homeservices.technician.data.shield.remote.ShieldApiService { *; }

# Sentry
-dontwarn io.sentry.**

# Keepattributes for reflection
-keepattributes Signature
-keepattributes *Annotation*

# GrowthBook SDK
-keep class com.sdk.growthbook.** { *; }
-dontwarn com.sdk.growthbook.**

# E11-S04 dashboard (Hilt ViewModel + Compose internals)
-keep class com.homeservices.technician.ui.dashboard.TechnicianDashboardViewModel { *; }
-keep class com.homeservices.technician.ui.dashboard.PendingActionCard { *; }
