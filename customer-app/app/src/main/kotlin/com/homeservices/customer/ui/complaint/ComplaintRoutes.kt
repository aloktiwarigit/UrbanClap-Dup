package com.homeservices.customer.ui.complaint

public object ComplaintRoutes {
    public const val ROUTE: String = "complaint/{bookingId}"

    public fun route(bookingId: String): String = "complaint/$bookingId"
}
