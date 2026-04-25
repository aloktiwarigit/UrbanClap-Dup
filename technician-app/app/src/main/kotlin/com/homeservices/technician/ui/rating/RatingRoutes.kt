package com.homeservices.technician.ui.rating

public object RatingRoutes {
    public const val ROUTE: String = "rating/{bookingId}"

    public fun route(bookingId: String): String = "rating/$bookingId"
}
