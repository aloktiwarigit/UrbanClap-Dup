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
    namespace = "com.homeservices.technician"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.homeservices.technician"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "com.homeservices.technician.TestRunner"

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
                    "*.HomeservicesTechnicianApplication",
                    "*.MainActivity",
                    "*.MainActivity\$*",
                    "*.TestRunner",
                    // Compose theme boilerplate (Color / Theme / Type) — framework wiring, not business logic
                    "*.ui.theme.*",
                    // Compose navigation graphs — NavHost lambdas are framework wiring, not unit-testable
                    "*.navigation.*",
                    // Hilt DI module — @Provides methods are framework wiring
                    "*.data.auth.di.*",
                    // Hilt DI module for job offer feature — @Provides methods are framework wiring
                    "*.data.jobOffer.di.*",
                    // Stub onboarding screen — placeholder Compose composable, no logic
                    "*.ui.onboarding.*",
                    // BiometricGateUseCase.requestAuth requires FragmentActivity + BiometricPrompt
                    // (Android OS framework calls), not unit-testable without instrumentation
                    "*.BiometricGateUseCase",
                    "*.BiometricGateUseCase\$*",
                    // Compose screen files generate *Kt JVM wrapper classes. The top-level class
                    // contains Compose-framework branches (recomposition guards, slot-table ops)
                    // that are only exercisable via Compose instrumented tests (Paparazzi covers
                    // the nested lambda which holds the actual when-branches).
                    "*.AuthScreenKt",
                    // KycScreen and sub-composables generate *Kt JVM wrapper classes with
                    // Compose-framework branches (recomposition guards, slot-table ops) only
                    // exercisable via Compose instrumented tests. Paparazzi covers rendering paths.
                    "*.KycScreenKt",
                    "*.KycScreenKt\$*",
                    // FirebaseOtpUseCase.sendOtp uses callbackFlow with PhoneAuthProvider —
                    // a real Firebase SDK callback that can't be triggered in JVM unit tests.
                    // signInWithCredential branches are tested separately.
                    "*.FirebaseOtpUseCase",
                    "*.FirebaseOtpUseCase\$*",
                    // TruecallerLoginUseCase.init/isAvailable/launch wrap TruecallerSDK static calls
                    // (Android SDK) that cannot be exercised in JVM unit tests. sdkCallback path
                    // is covered via simulateSdkCallback in TruecallerLoginUseCaseTest.
                    "*.TruecallerLoginUseCase",
                    // SentryInitializer wraps Android SDK initialisation — no JVM unit test path
                    "*.SentryInitializer",
                    // KycApiService is an internal Retrofit interface — its methods are invoked by
                    // the Retrofit runtime (not unit-testable). KycRepositoryImpl covers all
                    // reachable branches via mockk in KycRepositoryImplTest.
                    "*.KycApiService",
                    "*.KycApiService\$*",
                    // HomeservicesFcmService — @AndroidEntryPoint service with field injection;
                    // onMessageReceived requires a live FCM connection, not unit-testable
                    "*.HomeservicesFcmService",
                    "*.HomeservicesFcmService\$*",
                    // JobOfferScreen composable file generates *Kt JVM wrapper with framework branches
                    "*.JobOfferScreenKt",
                    "*.JobOfferScreenKt\$*",
                    // JobOfferApiService is an internal Retrofit interface — its methods are invoked
                    // by the Retrofit runtime (not unit-testable)
                    "*.JobOfferApiService",
                    "*.JobOfferApiService\$*",
                    // ActiveJob Hilt DI module — @Provides methods are framework wiring
                    "*.data.activeJob.di.*",
                    // Room database singleton — no unit-testable logic
                    "*.ActiveJobDatabase",
                    "*.ActiveJobDatabase\$*",
                    // ConnectivityObserver uses Android OS-level callbacks
                    "*.ConnectivityObserver",
                    "*.ConnectivityObserver\$*",
                    // ActiveJobScreen generates Compose *Kt wrapper classes
                    "*.ActiveJobScreenKt",
                    "*.ActiveJobScreenKt\$*",
                    // Room KSP-generated DAO/DB implementations contain anonymous Runnable/Callable
                    // inner classes that execute on Room's executor threads — not unit-testable
                    // without a real Android instrumented test environment.
                    "*.ActiveJobDatabase_Impl",
                    "*.ActiveJobDatabase_Impl\$*",
                    "*.ActiveJobDao_Impl",
                    "*.ActiveJobDao_Impl\$*",
                    // ActiveJobRepositoryImpl.getActiveJob() is a polling flow (while(true) + delay)
                    // that calls Firebase token + Retrofit. Repository is mocked in all consumer
                    // tests; the flow lambda itself requires a real network stack to exercise.
                    "*.ActiveJobRepositoryImpl\$getActiveJob\$1",
                    // ActiveJobApiService is an internal Retrofit interface — methods invoked by
                    // the Retrofit runtime, not unit-testable directly.
                    "*.ActiveJobApiService",
                    "*.ActiveJobApiService\$*",
                    // PhotoCaptureScreen generates Compose *Kt wrapper classes
                    "*.PhotoCaptureScreenKt",
                    "*.PhotoCaptureScreenKt\$*",
                    // JobPhotoRepositoryImpl wraps Firebase Storage + HTTP — requires live services
                    "*.JobPhotoRepositoryImpl",
                    "*.JobPhotoRepositoryImpl\$*",
                    // Photo DI module — @Provides methods are framework wiring
                    "*.data.photo.di.*",
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
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    implementation(libs.sentry.android)

    // Firebase (BOM manages all Firebase library versions)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth.ktx)
    implementation(libs.firebase.messaging)

    // Coroutines — play-services extensions (.await() on Task<T>)
    implementation(libs.kotlinx.coroutines.play.services)

    // Auth SDKs
    implementation(libs.truecaller.sdk)
    implementation(libs.androidx.security.crypto)
    implementation(libs.androidx.biometric)
    implementation(libs.androidx.navigation.compose)

    // KYC networking + serialization
    implementation(libs.retrofit.core)
    implementation(libs.retrofit.moshi)
    implementation(libs.okhttp.logging)
    implementation(libs.moshi.kotlin)
    implementation(libs.androidx.browser)
    implementation(libs.firebase.storage)

    // CameraX — on-device photo capture for job stage evidence (E06-S02)
    implementation(libs.camera.core)
    implementation(libs.camera.camera2)
    implementation(libs.camera.lifecycle)
    implementation(libs.camera.view)

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
