# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.

# Truecaller SDK — SDK classes use reflection; must not be renamed or removed
-keep class com.truecaller.android.sdk.** { *; }
-dontwarn com.truecaller.android.sdk.**

# Firebase Auth — required for phone auth credential classes
-keepattributes Signature
-keepattributes *Annotation*
