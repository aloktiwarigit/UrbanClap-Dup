package com.homeservices.customer.navigation

internal object CatalogueRoutes {
    const val SERVICE_DETAIL = "service_detail/{serviceId}?techId={techId}"

    fun serviceDetail(serviceId: String, technicianId: String? = null): String =
        if (technicianId != null) "service_detail/$serviceId?techId=$technicianId"
        else "service_detail/$serviceId"
}
