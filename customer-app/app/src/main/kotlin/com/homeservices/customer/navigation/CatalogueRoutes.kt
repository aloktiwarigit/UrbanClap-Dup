package com.homeservices.customer.navigation

internal object CatalogueRoutes {
    const val HOME = "catalogue_home"
    const val SERVICE_LIST = "service_list/{categoryId}"
    const val SERVICE_DETAIL = "service_detail/{serviceId}"

    fun serviceList(categoryId: String) = "service_list/$categoryId"
    fun serviceDetail(serviceId: String) = "service_detail/$serviceId"
}
