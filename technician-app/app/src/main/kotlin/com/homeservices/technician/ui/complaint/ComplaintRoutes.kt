package com.homeservices.technician.ui.complaint

public object ComplaintRoutes {
    public const val ROUTE: String = "complaint/{bookingId}"

    public fun route(bookingId: String): String = "complaint/$bookingId"
}
