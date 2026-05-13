package com.homeservices.technician.data.network.di

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.io.File
import java.nio.file.Files
import java.util.stream.Collectors

/**
 * Catches the failure mode: someone adds a new XxxApiService.kt and forgets to wire
 * it through the @AuthOkHttpClient interceptor + AuthInterceptorCoverageTest's allowlist.
 *
 * Scans technician-app/app/src/main/kotlin for `*ApiService.kt` files and asserts each
 * is either listed in AuthInterceptorCoverageTest.AUTH_BEARING_APIS (auth-bearing) or
 * in UNAUTH_API_SIMPLE_NAMES (the Integrity exception).
 */
public class AuthInterceptorCoverageCompletenessTest {
    @Test
    public fun `every ApiService is categorized as auth-bearing or explicitly unauth`() {
        val sourceRoot = locateSourceRoot()
        val apiServiceFiles =
            Files.walk(sourceRoot.toPath()).use { stream ->
                stream
                    .filter { p -> p.toString().endsWith("ApiService.kt") }
                    .collect(Collectors.toList())
            }
        assertThat(apiServiceFiles).isNotEmpty
        val discoveredSimpleNames =
            apiServiceFiles
                .map { p -> p.fileName.toString().removeSuffix(".kt") }
                .toSet()

        val authBearing = readAuthBearingNames()
        val uncategorized = discoveredSimpleNames - authBearing - UNAUTH_API_SIMPLE_NAMES
        assertThat(uncategorized)
            .describedAs(
                "Every *ApiService.kt must be listed in AuthInterceptorCoverageTest.AUTH_BEARING_APIS " +
                    "OR in AuthInterceptorCoverageCompletenessTest.UNAUTH_API_SIMPLE_NAMES. " +
                    "Uncategorized: $uncategorized",
            ).isEmpty()
    }

    /**
     * Reads AuthInterceptorCoverageTest.AUTH_BEARING_APIS reflectively. The list lives
     * on a `private companion object` — Kotlin emits the property's backing field
     * directly on the outer class (not on the inner `$Companion` class) for private
     * companions. We search both shapes for resilience.
     */
    private fun readAuthBearingNames(): Set<String> {
        val outer = AuthInterceptorCoverageTest::class.java
        val field =
            outer.declaredFields.firstOrNull { it.name == "AUTH_BEARING_APIS" }
                ?: run {
                    val companionField =
                        outer.declaredFields.firstOrNull { it.name == "Companion" }
                            ?: error("AuthInterceptorCoverageTest has no Companion / AUTH_BEARING_APIS field")
                    companionField.isAccessible = true
                    val companion = companionField.get(null)
                    companion.javaClass.declaredFields.firstOrNull { it.name == "AUTH_BEARING_APIS" }
                        ?: error("AUTH_BEARING_APIS not found on Companion class")
                }
        field.isAccessible = true
        val owner: Any? =
            if (java.lang.reflect.Modifier
                    .isStatic(field.modifiers)
            ) {
                null
            } else {
                null
            }

        @Suppress("UNCHECKED_CAST")
        val kClasses = field.get(owner) as List<kotlin.reflect.KClass<*>>
        return kClasses.mapNotNull { it.simpleName }.toSet()
    }

    private fun locateSourceRoot(): File {
        val cwd = File("").absoluteFile
        val candidates =
            listOf(
                File(cwd, "src/main/kotlin"), // Gradle test cwd = module dir (technician-app/app/)
                File(cwd, "app/src/main/kotlin"),
                File(cwd, "technician-app/app/src/main/kotlin"),
            )
        val found = candidates.firstOrNull { it.isDirectory }
        return found
            ?: error("Could not locate src/main/kotlin from cwd=$cwd. Tried: ${candidates.map { it.path }}")
    }

    private companion object {
        /**
         * ApiServices explicitly excluded from the @AuthOkHttpClient interceptor.
         * Currently empty — ADR-0021's revised design routes IntegrityApiService
         * through @AuthOkHttpClient as well (Firebase ID token is required by the
         * nonce endpoint). Reserved for any future unauth ApiService (e.g. health
         * probes, public catalog, etc.).
         */
        val UNAUTH_API_SIMPLE_NAMES: Set<String> = emptySet()
    }
}
