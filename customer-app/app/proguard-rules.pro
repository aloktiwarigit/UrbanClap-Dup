# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.

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
