package com.homeservices.customer.domain.catalogue.model

public data class Service(
    public val id: String,
    public val categoryId: String,
    public val name: String,
    public val description: String,
    public val basePrice: Int,        // paise
    public val durationMinutes: Int,
    public val imageUrl: String,
    public val includes: List<String>,
    public val addOns: List<AddOn>,
)
