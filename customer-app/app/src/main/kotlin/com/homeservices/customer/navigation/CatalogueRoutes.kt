package com.homeservices.customer.navigation

internal object CatalogueRoutes {
    const val HOME = "catalogue_home"
    const val SERVICE_LIST = "service_list/{categoryId}"
    const val SERVICE_DETAIL = "service_detail/{serviceId}?techId={techId}"

    fun serviceList(categoryId: String) = "service_list/$categoryId"

    fun serviceDetail(
        serviceId: String,
        technicianId: String? = null,
    ): String =
        if (technicianId != null) {
            "service_detail/$serviceId?techId=$technicianId"
        } else {
            "service_detail/$serviceId"
        }
}
