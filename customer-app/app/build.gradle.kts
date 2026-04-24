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
        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"${System.getenv("API_BASE_URL") ?: "http://10.0.2.2:7071"}\"",
        )
        buildConfigField(
            "String",
            "RAZORPAY_KEY_ID",
            "\"${System.getenv("RAZORPAY_KEY_ID") ?: ""}\"",
        )
        buildConfigField(
            "String",
            "MAPS_API_KEY",
            "\"${System.getenv("MAPS_API_KEY") ?: ""}\"",
        )
        manifestPlaceholders["MAPS_API_KEY"] = System.getenv("MAPS_API_KEY") ?: ""
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            // TODO(deploy-story): enable minification before Play Store submission — skeleton intentionally disabled
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
                    // Compose theme boilerplate (Color / Theme / Type) — framework wiring, not business logic
                    "*.ui.theme.*",
                    // Compose navigation graphs — NavHost lambdas are framework wiring, not unit-testable
                    "*.navigation.*",
                    // Hilt DI modules — @Provides methods are framework wiring
                    "*.data.auth.di.*",
                    "*.data.catalogue.di.*",
                    // Stub home screen — placeholder Compose composable, no logic
                    "*.ui.home.*",
                    // BiometricGateUseCase.requestAuth requires FragmentActivity + BiometricPrompt
                    // (Android OS framework calls), not unit-testable without instrumentation
                    "*.BiometricGateUseCase",
                    // Compose screen files generate *Kt JVM wrapper classes. The top-level class
                    // contains Compose-framework branches (recomposition guards, slot-table ops)
                    // that are only exercisable via Compose instrumented tests (Paparazzi covers
                    // the nested $AuthScreen$1 lambda which holds the actual when-branches).
                    "*.AuthScreenKt",
                    "*.AuthScreenKt\$*",
                    // Catalogue Compose screen files generate *Kt JVM wrapper classes with
                    // Compose-framework branches (recomposition guards, slot-table ops) that
                    // are only exercisable via Compose instrumented tests. Paparazzi covers
                    // the snapshot rendering; branch coverage is deferred to instrumented CI tests.
                    "*.CatalogueHomeScreenKt",
                    "*.CatalogueHomeScreenKt\$*",
                    "*.ServiceListScreenKt",
                    "*.ServiceListScreenKt\$*",
                    "*.ServiceDetailScreenKt",
                    "*.ServiceDetailScreenKt\$*",
                    // Booking flow Compose screen files — same rationale as catalogue screens above
                    "*.SlotPickerScreenKt",
                    "*.SlotPickerScreenKt\$*",
                    "*.AddressScreenKt",
                    "*.AddressScreenKt\$*",
                    "*.BookingSummaryScreenKt",
                    "*.BookingSummaryScreenKt\$*",
                    "*.BookingConfirmedScreenKt",
                    "*.BookingConfirmedScreenKt\$*",
                    // BookingUiState sealed class — data holders, no logic branches
                    "*.BookingUiState",
                    "*.BookingUiState\$*",
                    // Moshi KSP-generated JSON adapters — code-gen output, same rationale as Hilt factories
                    "*.*DtoJsonAdapter",
                    // BiometricResult sealed class — data holders, no logic branches
                    "*.domain.auth.model.BiometricResult",
                    "*.domain.auth.model.BiometricResult\$*",
                    // BiometricGateUseCase inner lambda classes (BiometricPrompt OS callback)
                    "*.BiometricGateUseCase\$*",
                    // TruecallerLoginUseCase — Truecaller SDK callbacks require live SDK + device
                    "*.TruecallerLoginUseCase",
                    "*.TruecallerLoginUseCase\$*",
                    // SessionManager companion object — EncryptedSharedPreferences requires Android context
                    "*.SessionManager\$Companion",
                    // FirebaseOtpUseCase.sendOtp uses callbackFlow with PhoneAuthProvider —
                    // a real Firebase SDK callback that can't be triggered in JVM unit tests.
                    // signInWithCredential branches are tested separately.
                    "*.FirebaseOtpUseCase",
                    "*.FirebaseOtpUseCase\$*",
                    // TrustDossierCard — Compose UI composables, same rationale as other screen *Kt classes
                    "*.TrustDossierCardKt",
                    "*.TrustDossierCardKt\$*",
                    // TrustDossierUiState — sealed class data holders, no logic branches
                    "*.TrustDossierUiState",
                    "*.TrustDossierUiState\$*",
                    // TechnicianProfileModule — Hilt @Provides wiring, same rationale as other DI modules
                    "*.data.technician.di.*",
                    // TechnicianProfileDto Moshi adapter — code-gen output
                    "*.TechnicianProfileDtoJsonAdapter",
                    "*.TechnicianReviewDtoJsonAdapter",
                    // ConfidenceScoreRow — Compose composable, same rationale as other *Kt screen classes
                    "*.ConfidenceScoreRowKt",
                    "*.ConfidenceScoreRowKt\$*",
                    // ConfidenceScoreUiState sealed class — data holders, no logic branches
                    "*.ConfidenceScoreUiState",
                    "*.ConfidenceScoreUiState\$*",
                    // ConfidenceScoreRepositoryImpl — thin Retrofit wrapper, integration-tested via API layer
                    "*.ConfidenceScoreRepositoryImpl",
                    "*.ConfidenceScoreRepositoryImpl\$*",
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
    implementation(libs.androidx.lifecycle.runtime.compose)

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

    // Coroutines — play-services extensions (.await() on Task<T>)
    implementation(libs.kotlinx.coroutines.play.services)

    // Auth SDKs
    implementation(libs.truecaller.sdk)
    implementation(libs.androidx.security.crypto)
    implementation(libs.androidx.biometric)
    implementation(libs.androidx.navigation.compose)

    // Networking / serialisation / image loading
    implementation(libs.retrofit.core)
    implementation(libs.retrofit.moshi)
    implementation(libs.okhttp.core)
    implementation(libs.okhttp.logging)
    implementation(libs.moshi.kotlin)
    ksp(libs.moshi.kotlin.codegen)
    implementation(libs.coil.compose)

    // Payments + Maps
    implementation(libs.razorpay.checkout)
    implementation(libs.google.places)
    implementation(libs.play.services.maps)

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.junit.jupiter.api)
    testRuntimeOnly(libs.junit.jupiter.engine)
    // JUnit 4 vintage engine: required for Paparazzi @Rule-based tests under the JUnit 5 launcher
    testRuntimeOnly(libs.junit.vintage.engine)
    testImplementation(libs.mockk)
    testImplementation(libs.assertj.core)
    testImplementation(libs.google.truth)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(libs.hilt.testing)
    testImplementation(libs.kotlinx.coroutines.test)
    kspTest(libs.hilt.compiler)

    androidTestImplementation(libs.hilt.testing)
    androidTestImplementation(libs.androidx.test.runner)
    kspAndroidTest(libs.hilt.compiler)
}
