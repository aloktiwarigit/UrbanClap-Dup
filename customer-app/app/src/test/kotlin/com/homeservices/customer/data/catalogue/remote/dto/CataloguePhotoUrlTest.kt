package com.homeservices.customer.data.catalogue.remote.dto

import com.google.common.truth.Truth.assertThat
import org.junit.Test

/**
 * E16-S03 — Tests for photo URL sourcing through the DTO → domain pipeline.
 *
 * AC-4: Photo URLs are sourced from the service catalogue API response.
 * AC-8: Unit tests cover URL sourcing and fallback logic.
 */
public class CataloguePhotoUrlTest {
    // ── CategoryDto ───────────────────────────────────────────────────────────

    @Test
    public fun `CategoryDto toDomain maps heroImageUrl to domain imageUrl`() {
        val dto =
            CategoryDto(
                id = "ac-repair",
                name = "AC Repair",
                imageUrl = "https://cdn.example.com/cat-ac.jpg",
                services = emptyList(),
            )

        val domain = dto.toDomain()

        assertThat(domain.imageUrl).isEqualTo("https://cdn.example.com/cat-ac.jpg")
    }

    @Test
    public fun `CategoryDto toDomain preserves blank heroImageUrl as empty string`() {
        val dto =
            CategoryDto(
                id = "plumbing",
                name = "Plumbing",
                imageUrl = "",
                services = emptyList(),
            )

        val domain = dto.toDomain()

        assertThat(domain.imageUrl).isEmpty()
    }

    // ── ServiceSummaryDto ─────────────────────────────────────────────────────

    @Test
    public fun `ServiceSummaryDto toServiceDomain maps heroImageUrl to domain imageUrl`() {
        val dto =
            ServiceSummaryDto(
                id = "ac-deep-clean",
                categoryId = "ac-repair",
                name = "AC Deep Clean",
                shortDescription = "Full indoor unit clean",
                heroImageUrl = "https://cdn.example.com/svc-ac.jpg",
                basePrice = 59900,
                durationMinutes = 60,
            )

        val domain = dto.toServiceDomain()

        assertThat(domain.imageUrl).isEqualTo("https://cdn.example.com/svc-ac.jpg")
    }

    @Test
    public fun `ServiceSummaryDto toServiceDomain preserves blank heroImageUrl`() {
        val dto =
            ServiceSummaryDto(
                id = "ac-deep-clean",
                categoryId = "ac-repair",
                name = "AC Deep Clean",
                shortDescription = "Full indoor unit clean",
                heroImageUrl = "",
                basePrice = 59900,
                durationMinutes = 60,
            )

        val domain = dto.toServiceDomain()

        assertThat(domain.imageUrl).isEmpty()
    }

    // ── ServiceDto ────────────────────────────────────────────────────────────

    @Test
    public fun `ServiceDto toDomain prefers imageUrl over heroImageUrl`() {
        val dto =
            ServiceDto(
                id = "ac-deep-clean",
                categoryId = "ac-repair",
                name = "AC Deep Clean",
                basePrice = 59900,
                durationMinutes = 60,
                imageUrl = "https://cdn.example.com/direct.jpg",
                heroImageUrl = "https://cdn.example.com/hero.jpg",
            )

        val domain = dto.toDomain()

        assertThat(domain.imageUrl).isEqualTo("https://cdn.example.com/direct.jpg")
    }

    @Test
    public fun `ServiceDto toDomain falls back to heroImageUrl when imageUrl is null`() {
        val dto =
            ServiceDto(
                id = "ac-deep-clean",
                categoryId = "ac-repair",
                name = "AC Deep Clean",
                basePrice = 59900,
                durationMinutes = 60,
                imageUrl = null,
                heroImageUrl = "https://cdn.example.com/hero.jpg",
            )

        val domain = dto.toDomain()

        assertThat(domain.imageUrl).isEqualTo("https://cdn.example.com/hero.jpg")
    }

    @Test
    public fun `ServiceDto toDomain yields empty string when both imageUrl and heroImageUrl are null`() {
        val dto =
            ServiceDto(
                id = "ac-deep-clean",
                categoryId = "ac-repair",
                name = "AC Deep Clean",
                basePrice = 59900,
                durationMinutes = 60,
                imageUrl = null,
                heroImageUrl = null,
            )

        val domain = dto.toDomain()

        assertThat(domain.imageUrl).isEmpty()
    }

    // ── Image URL resolution helper (mirrors composable logic) ───────────────

    @Test
    public fun `resolveCardImageUrl returns true when URL is non-blank`() {
        assertThat(resolveCardImageUrl("https://cdn.example.com/img.jpg")).isTrue()
    }

    @Test
    public fun `resolveCardImageUrl returns false when URL is blank`() {
        assertThat(resolveCardImageUrl("")).isFalse()
    }

    @Test
    public fun `resolveCardImageUrl returns false when URL is whitespace only`() {
        assertThat(resolveCardImageUrl("   ")).isFalse()
    }

    /**
     * Mirrors the composable fallback predicate:
     * a URL is considered "usable" if it is not blank after trimming.
     */
    private fun resolveCardImageUrl(url: String): Boolean = url.isNotBlank()
}
