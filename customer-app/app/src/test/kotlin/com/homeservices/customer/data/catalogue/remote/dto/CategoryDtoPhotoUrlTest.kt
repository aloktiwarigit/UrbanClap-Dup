package com.homeservices.customer.data.catalogue.remote.dto

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * E16-S03 — Verifies the DTO pipeline carries `heroImageUrl` through to
 * the domain `imageUrl` field for both [CategoryDto] and the two service DTO
 * shapes. This is the contract that PhotoFirstCategoryCard / PhotoFirstServiceCard
 * rely on once the catalogue API serves CDN URLs.
 */
public class CategoryDtoPhotoUrlTest {
    @Test
    public fun `CategoryDto heroImageUrl is carried to Category imageUrl`() {
        val dto =
            CategoryDto(
                id = "ac-repair",
                name = "AC Repair",
                heroImageUrl = "https://cdn.example.com/cat.jpg",
                sortOrder = 1,
                services = emptyList(),
            )
        assertThat(dto.toDomain().imageUrl).isEqualTo("https://cdn.example.com/cat.jpg")
    }

    @Test
    public fun `CategoryDto blank heroImageUrl is carried through (triggers fallback downstream)`() {
        val dto =
            CategoryDto(
                id = "ac-repair",
                name = "AC Repair",
                heroImageUrl = "",
                sortOrder = 1,
                services = emptyList(),
            )
        assertThat(dto.toDomain().imageUrl).isEmpty()
    }

    @Test
    public fun `ServiceCardDto heroImageUrl is carried to Service imageUrl`() {
        val dto =
            ServiceCardDto(
                id = "ac-clean",
                categoryId = "ac-repair",
                name = "AC deep cleaning",
                shortDescription = "Foam cleaning + filter wash",
                heroImageUrl = "https://cdn.example.com/svc.jpg",
                basePrice = 79900,
                durationMinutes = 60,
            )
        assertThat(dto.toDomain().imageUrl).isEqualTo("https://cdn.example.com/svc.jpg")
    }

    @Test
    public fun `ServiceDto heroImageUrl is carried to Service imageUrl`() {
        val dto =
            ServiceDto(
                id = "ac-clean",
                categoryId = "ac-repair",
                name = "AC deep cleaning",
                shortDescription = "Foam cleaning + filter wash",
                heroImageUrl = "https://cdn.example.com/svc-detail.jpg",
                basePrice = 79900,
                durationMinutes = 60,
                includes = emptyList(),
                addOns = emptyList(),
            )
        assertThat(dto.toDomain().imageUrl).isEqualTo("https://cdn.example.com/svc-detail.jpg")
    }

    @Test
    public fun `ServiceDto blank heroImageUrl is carried through`() {
        val dto =
            ServiceDto(
                id = "ac-clean",
                categoryId = "ac-repair",
                name = "AC deep cleaning",
                shortDescription = "Foam cleaning + filter wash",
                heroImageUrl = "",
                basePrice = 79900,
                durationMinutes = 60,
                includes = emptyList(),
                addOns = emptyList(),
            )
        assertThat(dto.toDomain().imageUrl).isEmpty()
    }
}
