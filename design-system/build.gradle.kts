import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ktlint)
    alias(libs.plugins.detekt)
    alias(libs.plugins.paparazzi)
    alias(libs.plugins.kover)
}

group = "com.homeservices"

android {
    namespace = "com.homeservices.designsystem"
    compileSdk = 35

    defaultConfig {
        minSdk = 26
        consumerProguardFiles("proguard-rules.pro")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
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
        // Story E01-S04 pins specific versions (AGP 8.6.0, Compose BOM 2024.11.00, etc.) per
        // architecture decision. Suppress advisory "newer version available" checks to avoid
        // false failures. LintError suppresses internal lint FIR crash (AGP 8.6.0 + K2 known
        // issue on unit-test supertype resolution).
        disable += setOf("OldTargetApi", "AndroidGradlePluginVersion", "GradleDependency", "LintError")
    }

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
            // Required for JUnit 5 (Jupiter) test discovery under the Android AGP test runner.
            // Without this, @Test-annotated functions are silently ignored (0 tests found).
            all { it.useJUnitPlatform() }
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
    config.setFrom(file("detekt.yml"))
    buildUponDefaultConfig = true
    allRules = false
    autoCorrect = false
    ignoreFailures = false
}

kover {
    reports {
        filters {
            excludes {
                classes(
                    // Hilt & Dagger generated code (pattern parity with customer-app; defensive)
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
                    // Compose theme boilerplate (Color / Theme / Type) — framework wiring, not business logic
                    "*.ui.theme.*",
                    // Gallery composable is Paparazzi-rendered; coverage instrumentation doesn't capture Compose lambda bodies under layoutlib
                    "*.gallery.*",
                    // HomeservicesTheme @Composable wrapper — if(darkTheme) branches only exercised
                    // via Paparazzi (layoutlib classloader), not credited by Kover. Token values are
                    // tested directly in theme/*Test.kt; the wrapper's slot-mapping logic is covered
                    // visually by TokenGalleryPaparazziTest light + dark snapshots.
                    "com.homeservices.designsystem.theme.HomeservicesThemeKt",
                )
            }
        }
        verify {
            rule {
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.LINE)
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.INSTRUCTION)
                // BRANCH threshold intentionally omitted for this module.
                // The Compose compiler inserts synthetic branches into @Composable function
                // bodies (recomposition-tracking conditionals) that Kover counts but cannot
                // cover via plain JUnit tests — HomeservicesTheme shows 10 such branches, of
                // which only the 4 real if(darkTheme) branches are reachable via the extracted
                // selectColorScheme / selectExtendedColors helpers (tested in ThemeSelectorsTest).
                // The remaining synthetic branches can only be exercised via Paparazzi under
                // layoutlib, which Kover does not instrument (plan B10). LINE + INSTRUCTION
                // gates remain at 80% and are honest signals for this module.
            }
        }
    }
}

// Paparazzi 1.3.5 picks up the correct layoutlib for the Compose BOM automatically.
// No paparazzi {} configuration block is needed or valid.

dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.compose.material3)

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.junit.jupiter.api)
    testRuntimeOnly(libs.junit.jupiter.engine)
    // JUnit 4 vintage engine: required for Paparazzi @Rule-based tests under the JUnit 5 launcher
    testRuntimeOnly(libs.junit.vintage.engine)
    testImplementation(libs.assertj.core)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
}
