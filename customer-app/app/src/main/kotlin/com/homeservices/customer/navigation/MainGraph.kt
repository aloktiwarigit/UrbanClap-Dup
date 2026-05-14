package com.homeservices.customer.navigation

import androidx.compose.runtime.getValue
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
import com.homeservices.customer.ui.booking.AddressScreen
import com.homeservices.customer.ui.booking.BookingConfirmedScreen
import com.homeservices.customer.ui.booking.BookingSummaryScreen
import com.homeservices.customer.ui.booking.BookingViewModel
import com.homeservices.customer.ui.booking.PriceApprovalScreen
import com.homeservices.customer.ui.booking.PriceApprovalViewModel
import com.homeservices.customer.ui.booking.SlotPickerScreen
import com.homeservices.customer.ui.catalogue.CatalogueHomeScreen
import com.homeservices.customer.ui.catalogue.CatalogueHomeViewModel
import com.homeservices.customer.ui.catalogue.ServiceDetailScreen
import com.homeservices.customer.ui.catalogue.ServiceDetailViewModel
import com.homeservices.customer.ui.catalogue.ServiceListScreen
import com.homeservices.customer.ui.catalogue.ServiceListViewModel
import com.homeservices.customer.ui.complaint.ComplaintRoutes
import com.homeservices.customer.ui.complaint.ComplaintScreen
import com.homeservices.customer.ui.rating.RatingRoutes
import com.homeservices.customer.ui.rating.RatingScreen
import com.homeservices.customer.ui.tracking.LiveTrackingScreen
import com.homeservices.customer.ui.tracking.LiveTrackingViewModel
import com.homeservices.customer.ui.wallet.WalletBalanceUiState
import com.homeservices.customer.ui.wallet.WalletRoutes
import com.homeservices.customer.ui.wallet.WalletScreen
import com.homeservices.customer.ui.wallet.WalletViewModel

internal fun NavGraphBuilder.mainGraph(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    catalogueGraph(navController, featureFlags)
    bookingGraph(navController)
}

// ── Catalogue nested graph ────────────────────────────────────────────────────

private fun NavGraphBuilder.catalogueGraph(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    navigation(startDestination = CatalogueRoutes.HOME, route = "main") {
        homeDestination(navController, featureFlags)
        walletDestination(navController)
        serviceListDestination(navController)
        serviceDetailDestination(navController)
    }
}

private fun NavGraphBuilder.homeDestination(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    composable(CatalogueRoutes.HOME) {
        val vm: CatalogueHomeViewModel = hiltViewModel()
        val walletVm: WalletViewModel = hiltViewModel()
        val walletBalanceState by walletVm.balanceState.collectAsStateWithLifecycle()
        val balancePaise =
            if (featureFlags.walletVisible()) {
                (walletBalanceState as? WalletBalanceUiState.Ready)?.balance?.balanceInPaise ?: 0L
            } else {
                0L
            }
        CatalogueHomeScreen(
            viewModel = vm,
            onCategoryClick = { id -> navController.navigate(CatalogueRoutes.serviceList(id)) },
            onSettingsClick = { navController.navigate(LocaleRoutes.SETTINGS) },
            onProfileLanguageClick = { navController.navigate(LocaleRoutes.LANGUAGE_SETTINGS) },
            onTrackBooking = { id -> navController.navigate(BookingRoutes.liveTrackingRoute(id)) },
            showWalletChip = featureFlags.walletVisible(),
            walletBalanceInPaise = balancePaise,
            onWalletClick = { navController.navigate(WalletRoutes.WALLET) },
        )
    }
}

private fun NavGraphBuilder.walletDestination(navController: NavController) {
    composable(WalletRoutes.WALLET) {
        val vm: WalletViewModel = hiltViewModel()
        WalletScreen(viewModel = vm, onBack = { navController.popBackStack() })
    }
}

private fun NavGraphBuilder.serviceListDestination(navController: NavController) {
    composable(
        route = CatalogueRoutes.SERVICE_LIST,
        arguments = listOf(navArgument("categoryId") { type = NavType.StringType }),
    ) {
        val vm: ServiceListViewModel = hiltViewModel()
        ServiceListScreen(
            viewModel = vm,
            onServiceClick = { id -> navController.navigate(CatalogueRoutes.serviceDetail(id)) },
            onBack = { navController.popBackStack() },
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

private fun NavGraphBuilder.bookingGraph(navController: NavController) {
    navigation(startDestination = BookingRoutes.SLOT_PICKER, route = BookingRoutes.BOOKING_GRAPH) {
        slotPickerDestination(navController)
        addressDestination(navController)
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

private fun NavGraphBuilder.slotPickerDestination(navController: NavController) {
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
            onSlotSelected = { slot ->
                vm.pendingServiceId = serviceId
                vm.pendingCategoryId = categoryId
                vm.setSlotAndAddress(slot, "", 0.0, 0.0)
                navController.navigate(BookingRoutes.ADDRESS)
            },
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
            onConfirmed = { bookingId ->
                navController.navigate(BookingRoutes.confirmedRoute(bookingId)) {
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
        arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
    ) { backStackEntry ->
        val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
        BookingConfirmedScreen(
            bookingId = bookingId,
            onBackToHome = { navController.popBackStack(CatalogueRoutes.HOME, inclusive = false) },
            onTrackBooking = { id -> navController.navigate(BookingRoutes.liveTrackingRoute(id)) },
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
