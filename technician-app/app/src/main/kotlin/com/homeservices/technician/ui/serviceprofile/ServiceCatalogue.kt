package com.homeservices.technician.ui.serviceprofile

internal data class ServiceCatalogueItem(
    val id: String,
    val name: String,
    val group: String,
)

internal object ServiceCatalogue {
    val items: List<ServiceCatalogueItem> =
        listOf(
            ServiceCatalogueItem("ac-deep-clean", "AC Deep Clean", "AC"),
            ServiceCatalogueItem("ac-deep-clean-window", "AC Deep Clean (Window)", "AC"),
            ServiceCatalogueItem("ac-gas-refill", "AC Gas Refill", "AC"),
            ServiceCatalogueItem("ac-installation", "AC Installation", "AC"),
            ServiceCatalogueItem("plumbing-leak-fix", "Leak Fix", "Plumbing"),
            ServiceCatalogueItem("plumbing-tap-install", "Tap / Faucet Installation", "Plumbing"),
            ServiceCatalogueItem("plumbing-pipe-repair", "Pipe Repair", "Plumbing"),
            ServiceCatalogueItem("electrical-fan-install", "Ceiling Fan Installation", "Electrical"),
            ServiceCatalogueItem("electrical-switchboard-fix", "Switchboard Repair", "Electrical"),
            ServiceCatalogueItem("electrical-wiring", "New Point Wiring", "Electrical"),
            ServiceCatalogueItem("ro-installation", "RO Installation", "Water Purifier"),
            ServiceCatalogueItem("ro-service-amc", "RO Service / Filter Change", "Water Purifier"),
            ServiceCatalogueItem("water-pump-repair", "Water Pump Repair", "Water Pump"),
            ServiceCatalogueItem("borewell-servicing", "Borewell Servicing", "Water Pump"),
        )
}
