package com.homeservices.customer.domain.catalogue.model

public data class Category(
    public val id: String,
    public val name: String,
    public val imageUrl: String,
    public val serviceCount: Int,
    public val minPricePaise: Int,
    public val safetyTag: Boolean = false,
    public val nameHi: String? = null,
)
