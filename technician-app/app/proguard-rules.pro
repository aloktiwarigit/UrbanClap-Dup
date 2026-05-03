# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.

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
