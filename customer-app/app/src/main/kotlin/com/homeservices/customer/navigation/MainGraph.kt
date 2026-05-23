@file:Suppress("TooManyFunctions")

package com.homeservices.customer.navigation

import androidx.compose.runtime.remember
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.navigation
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.ui.booking.AddressPickerScreen
import com.homeservices.customer.ui.booking.AddressScreen
import com.homeservices.customer.ui.booking.BookingConfirmedScreen
import com.homeservices.customer.ui.booking.BookingSummaryScreen
import com.homeservices.customer.ui.booking.BookingUiState
import com.homeservices.customer.ui.booking.BookingViewModel
import com.homeservices.customer.ui.booking.PriceApprovalScreen
import com.homeservices.customer.ui.booking.PriceApprovalViewModel
import com.homeservices.customer.ui.booking.SlotPickerScreen
import com.homeservices.customer.ui.catalogue.CatalogueHomeScreen
import com.homeservices.customer.ui.catalogue.CatalogueHomeViewModel
import com.homeservices.customer.ui.catalogue.CustomerHomeViewModel
import com.homeservices.customer.ui.catalogue.ServiceDetailScreen
import com.homeservices.customer.ui.catalogue.ServiceDetailViewModel
import com.homeservices.customer.ui.catalogue.ServiceListScreen
import com.homeservices.customer.ui.catalogue.ServiceListViewModel
import com.homeservices.customer.ui.complaint.ComplaintListScreen
import com.homeservices.customer.ui.complaint.ComplaintRoutes
import com.homeservices.customer.ui.complaint.ComplaintScreen
import com.homeservices.customer.ui.rating.RatingRoutes
import com.homeservices.customer.ui.rating.RatingScreen
import com.homeservices.customer.ui.tracking.LiveTrackingScreen
import com.homeservices.customer.ui.tracking.LiveTrackingViewModel
import com.homeservices.customer.ui.waitlist.WaitlistScreen
import com.homeservices.customer.ui.wallet.WalletBalanceUiState
import com.homeservices.customer.ui.wallet.WalletRoutes
import com.homeservices.customer.ui.wallet.WalletScreen
import com.homeservices.customer.ui.wallet.WalletViewModel

private const val AYODHYA_CENTER_LAT = 26.7958
private const val AYODHYA_CENTER_LNG = 82.1947
private const val AYODHYA_CENTER_LAT_F = 26.7958f
private const val AYODHYA_CENTER_LNG_F = 82.1947f

internal fun NavGraphBuilder.mainGraph(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    catalogueGraph(navController, featureFlags)
    bookingGraph(navController, featureFlags)
}

// ── Catalogue nested graph ────────────────────────────────────────────────────

private fun NavGraphBuilder.catalogueGraph(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    navigation(startDestination = CatalogueRoutes.HOME, route = ROUTE_MAIN) {
        homeDestination(navController, featureFlags)
        walletDestination(navController)
        serviceListDestination(navController, featureFlags)
        serviceDetailDestination(navController)
        // Complaint list — accessible from Settings → My Complaints
        composable(route = ComplaintRoutes.LIST) {
            ComplaintListScreen(
                onComplaintClick = { bookingId -> navController.navigate(ComplaintRoutes.route(bookingId)) },
                onBack = { navController.popBackStack() },
            )
        }
    }
}

private fun NavGraphBuilder.homeDestination(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    composable(CatalogueRoutes.HOME) {
        val vm: CatalogueHomeViewModel = hiltViewModel()
        val customerHomeVm: CustomerHomeViewModel = hiltViewModel()
        val walletVm: WalletViewModel? = if (featureFlags.walletVisible()) hiltViewModel() else null
        val walletBalanceState = walletVm?.balanceState?.collectAsStateWithLifecycle()?.value
        val balancePaise =
            (walletBalanceState as? WalletBalanceUiState.Ready)?.balance?.balanceInPaise ?: 0L
        CatalogueHomeScreen(
            viewModel = vm,
            customerHomeViewModel = customerHomeVm,
            onCategoryClick = { id -> navController.navigate(CatalogueRoutes.serviceList(id)) },
            onSettingsClick = { navController.navigate(LocaleRoutes.SETTINGS) },
            onProfileLanguageClick = { navController.navigate(LocaleRoutes.LANGUAGE_SETTINGS) },
            onTrackBooking = { id -> navController.navigate(BookingRoutes.liveTrackingRoute(id)) },
            onRateBooking = { id -> navController.navigate(RatingRoutes.route(id)) },
            onComplainBooking = { id -> navController.navigate(ComplaintRoutes.route(id)) },
            showWalletChip = featureFlags.walletVisible(),
            walletBalanceInPaise = balancePaise,
            onWalletClick = { navController.navigate(WalletRoutes.WALLET) },
            photoFirstCatalogueEnabled = featureFlags.photoFirstCatalogueEnabled(),
            // E11-S03: durable-hooks navigation callbacks
            onPendingActionRoute = { uri ->
                // Route URI format: homeservices://action/<TYPE>?bookingId=<id>
                // Resolve specific action routes that the nav graph already supports.
                val bookingId = uri.substringAfter("bookingId=", "").substringBefore("&")
                when {
                    "RATING_PROMPT_CUSTOMER" in uri && bookingId.isNotEmpty() ->
                        navController.navigate(RatingRoutes.route(bookingId))
                    "ADDON_APPROVAL_REQUESTED" in uri && bookingId.isNotEmpty() ->
                        navController.navigate(BookingRoutes.priceApprovalRoute(bookingId))
                    "COMPLAINT_UPDATE" in uri && bookingId.isNotEmpty() ->
                        navController.navigate(ComplaintRoutes.route(bookingId))
                    else -> Unit // Unknown type — no-op until E11-S01b-2 route migration
                }
            },
            onPriceApproval = { id -> navController.navigate(BookingRoutes.priceApprovalRoute(id)) },
            // WS-D: consent management accessible from Profile tab
            onManageConsentClick = { navController.navigate(LocaleRoutes.CONSENT_MANAGEMENT) },
        )
    }
}

private fun NavGraphBuilder.walletDestination(navController: NavController) {
    composable(WalletRoutes.WALLET) {
        val vm: WalletViewModel = hiltViewModel()
        WalletScreen(viewModel = vm, onBack = { navController.popBackStack() })
    }
}

private fun NavGraphBuilder.serviceListDestination(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    composable(
        route = CatalogueRoutes.SERVICE_LIST,
        arguments = listOf(navArgument("categoryId") { type = NavType.StringType }),
    ) {
        val vm: ServiceListViewModel = hiltViewModel()
        ServiceListScreen(
            viewModel = vm,
            onServiceClick = { id -> navController.navigate(CatalogueRoutes.serviceDetail(id)) },
            onBack = { navController.popBackStack() },
            photoFirstCatalogueEnabled = featureFlags.photoFirstCatalogueEnabled(),
        )
    }
}

private fun NavGraphBuilder.serviceDetailDestination(navController: NavController) {
    composable(
        route = CatalogueRoutes.SERVICE_DETAIL,
        arguments =
            listOf(
                navArgument("serviceId") { type = NavType.StringType },
                navArgument("techId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                },
            ),
    ) {
        val vm: ServiceDetailViewModel = hiltViewModel()
        ServiceDetailScreen(
            viewModel = vm,
            onBookNow = { svcId, catId -> navController.navigate(BookingRoutes.slotPicker(svcId, catId)) },
            onBack = { navController.popBackStack() },
        )
    }
}

// ── Booking flow — BookingViewModel scoped to the booking nested graph ─────────

private fun NavGraphBuilder.bookingGraph(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    navigation(startDestination = BookingRoutes.SLOT_PICKER, route = BookingRoutes.BOOKING_GRAPH) {
        slotPickerDestination(navController, featureFlags)
        addressDestination(navController)
        addressPickerDestination(navController)
        waitlistDestination(navController)
        summaryDestination(navController)
        confirmedDestination(navController)
        priceApprovalDestination(navController)
        liveTrackingDestination(navController)
        composable(
            route = RatingRoutes.ROUTE,
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
        ) { RatingScreen() }
        complaintDestination(navController)
    }
}

private fun NavGraphBuilder.slotPickerDestination(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    composable(
        route = BookingRoutes.SLOT_PICKER,
        arguments =
            listOf(
                navArgument("serviceId") { type = NavType.StringType },
                navArgument("categoryId") { type = NavType.StringType },
            ),
    ) { backStackEntry ->
        val bookingEntry = remember(backStackEntry) { navController.getBackStackEntry(BookingRoutes.BOOKING_GRAPH) }
        val vm: BookingViewModel = hiltViewModel(bookingEntry)
        val serviceId = backStackEntry.arguments?.getString("serviceId") ?: ""
        val categoryId = backStackEntry.arguments?.getString("categoryId") ?: ""
        SlotPickerScreen(
            serviceId = serviceId,
            onSlotSelected = { slot ->
                vm.pendingServiceId = serviceId
                vm.pendingCategoryId = categoryId
                vm.setSlotAndAddress(slot, "", 0.0, 0.0)
                // Feature flag: use new Places picker or legacy address screen
                if (featureFlags.placesAutocompleteEnabled()) {
                    navController.navigate(BookingRoutes.addressPicker(serviceId))
                } else {
                    navController.navigate(BookingRoutes.ADDRESS)
                }
            },
            onBack = { navController.popBackStack() },
        )
    }
}

private fun NavGraphBuilder.addressPickerDestination(navController: NavController) {
    composable(
        route = BookingRoutes.ADDRESS_PICKER,
        arguments = listOf(navArgument("serviceId") { type = NavType.StringType }),
    ) { backStackEntry ->
        val serviceId = backStackEntry.arguments?.getString("serviceId") ?: ""
        val bookingEntry = remember(backStackEntry) { navController.getBackStackEntry(BookingRoutes.BOOKING_GRAPH) }
        val vm: BookingViewModel = hiltViewModel(bookingEntry)
        AddressPickerScreen(
            serviceId = serviceId,
            onConfirmed = { addressText, lat, lng ->
                val state = vm.uiState.value
                val slot = (state as? BookingUiState.Ready)?.slot ?: return@AddressPickerScreen
                vm.setSlotAndAddress(slot, addressText, lat, lng)
                navController.navigate(BookingRoutes.SUMMARY)
            },
            onRefused = { lat, lng, svcId ->
                navController.navigate(BookingRoutes.waitlist(lat, lng, svcId))
            },
            onBack = { navController.popBackStack() },
        )
    }
}

private fun NavGraphBuilder.waitlistDestination(navController: NavController) {
    composable(
        route = BookingRoutes.WAITLIST,
        arguments =
            listOf(
                navArgument("lat") {
                    type = NavType.FloatType
                    defaultValue = AYODHYA_CENTER_LAT_F
                },
                navArgument("lng") {
                    type = NavType.FloatType
                    defaultValue = AYODHYA_CENTER_LNG_F
                },
                navArgument("serviceId") { type = NavType.StringType },
            ),
    ) { backStackEntry ->
        val lat = backStackEntry.arguments?.getFloat("lat")?.toDouble() ?: AYODHYA_CENTER_LAT
        val lng = backStackEntry.arguments?.getFloat("lng")?.toDouble() ?: AYODHYA_CENTER_LNG
        val serviceId = backStackEntry.arguments?.getString("serviceId") ?: ""
        WaitlistScreen(
            lat = lat,
            lng = lng,
            serviceId = serviceId,
            onBack = { navController.popBackStack() },
        )
    }
}

private fun NavGraphBuilder.addressDestination(navController: NavController) {
    composable(BookingRoutes.ADDRESS) { backStackEntry ->
        val bookingEntry = remember(backStackEntry) { navController.getBackStackEntry(BookingRoutes.BOOKING_GRAPH) }
        val vm: BookingViewModel = hiltViewModel(bookingEntry)
        AddressScreen(
            onAddressConfirmed = { addressText, lat, lng ->
                val state = vm.uiState.value
                val slot =
                    (state as? com.homeservices.customer.ui.booking.BookingUiState.Ready)?.slot
                        ?: return@AddressScreen
                vm.setSlotAndAddress(slot, addressText, lat, lng)
                navController.navigate(BookingRoutes.SUMMARY)
            },
            onBack = { navController.popBackStack() },
        )
    }
}

private fun NavGraphBuilder.summaryDestination(navController: NavController) {
    composable(BookingRoutes.SUMMARY) { backStackEntry ->
        val bookingEntry = remember(backStackEntry) { navController.getBackStackEntry(BookingRoutes.BOOKING_GRAPH) }
        val vm: BookingViewModel = hiltViewModel(bookingEntry)
        BookingSummaryScreen(
            viewModel = vm,
            serviceId = vm.pendingServiceId,
            categoryId = vm.pendingCategoryId,
            onConfirmed = { bookingId, appliedCredit ->
                navController.navigate(BookingRoutes.confirmedRoute(bookingId, appliedCredit)) {
                    popUpTo(BookingRoutes.BOOKING_GRAPH) { inclusive = true }
                }
            },
            onBack = { navController.popBackStack() },
        )
    }
}

private fun NavGraphBuilder.confirmedDestination(navController: NavController) {
    composable(
        route = BookingRoutes.CONFIRMED,
        arguments =
            listOf(
                navArgument("bookingId") { type = NavType.StringType },
                navArgument("appliedCredit") {
                    type = NavType.IntType
                    defaultValue = 0
                },
            ),
    ) { backStackEntry ->
        val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
        val appliedCredit = backStackEntry.arguments?.getInt("appliedCredit") ?: 0
        BookingConfirmedScreen(
            bookingId = bookingId,
            onBackToHome = { navController.popBackStack(CatalogueRoutes.HOME, inclusive = false) },
            onTrackBooking = { id -> navController.navigate(BookingRoutes.liveTrackingRoute(id)) },
            appliedCreditAmount = appliedCredit,
        )
    }
}

private fun NavGraphBuilder.priceApprovalDestination(navController: NavController) {
    composable(
        route = BookingRoutes.PRICE_APPROVAL,
        arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
    ) { backStackEntry ->
        val vm: PriceApprovalViewModel = hiltViewModel()
        PriceApprovalScreen(
            viewModel = vm,
            bookingId = backStackEntry.arguments?.getString("bookingId") ?: "",
            onApprovalComplete = { navController.popBackStack() },
        )
    }
}

private fun NavGraphBuilder.liveTrackingDestination(navController: NavController) {
    composable(
        route = BookingRoutes.LIVE_TRACKING,
        arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
    ) {
        val vm: LiveTrackingViewModel = hiltViewModel()
        LiveTrackingScreen(
            viewModel = vm,
            onBack = { navController.popBackStack() },
            onFileComplaint = { id -> navController.navigate(ComplaintRoutes.route(id)) },
        )
    }
}

private fun NavGraphBuilder.complaintDestination(navController: NavController) {
    composable(
        route = ComplaintRoutes.ROUTE,
        arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
    ) { backStackEntry ->
        val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
        ComplaintScreen(bookingId = bookingId, onBack = { navController.popBackStack() })
    }
}
