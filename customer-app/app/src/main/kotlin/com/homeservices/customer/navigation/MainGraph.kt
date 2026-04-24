package com.homeservices.customer.navigation

import androidx.compose.runtime.remember
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.navigation
import com.homeservices.customer.ui.booking.AddressScreen
import com.homeservices.customer.ui.booking.BookingConfirmedScreen
import com.homeservices.customer.ui.booking.BookingSummaryScreen
import com.homeservices.customer.ui.booking.BookingViewModel
import com.homeservices.customer.ui.booking.SlotPickerScreen
import com.homeservices.customer.ui.catalogue.CatalogueHomeScreen
import com.homeservices.customer.ui.catalogue.CatalogueHomeViewModel
import com.homeservices.customer.ui.catalogue.ServiceDetailScreen
import com.homeservices.customer.ui.catalogue.ServiceDetailViewModel
import com.homeservices.customer.ui.catalogue.ServiceListScreen
import com.homeservices.customer.ui.catalogue.ServiceListViewModel

internal fun NavGraphBuilder.mainGraph(navController: NavController) {
    navigation(startDestination = CatalogueRoutes.HOME, route = "main") {
        composable(CatalogueRoutes.HOME) {
            val vm: CatalogueHomeViewModel = hiltViewModel()
            CatalogueHomeScreen(
                viewModel = vm,
                onCategoryClick = { id -> navController.navigate(CatalogueRoutes.serviceList(id)) },
            )
        }
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
                onBookNow = { svcId, catId ->
                    navController.navigate(BookingRoutes.slotPicker(svcId, catId))
                },
                onBack = { navController.popBackStack() },
            )
        }
    }

    // Booking flow — BookingViewModel scoped to the booking nested graph
    navigation(
        startDestination = BookingRoutes.SLOT_PICKER,
        route = BookingRoutes.BOOKING_GRAPH,
    ) {
        composable(
            route = BookingRoutes.SLOT_PICKER,
            arguments =
                listOf(
                    navArgument("serviceId") { type = NavType.StringType },
                    navArgument("categoryId") { type = NavType.StringType },
                ),
        ) { backStackEntry ->
            val bookingEntry =
                remember(backStackEntry) {
                    navController.getBackStackEntry(BookingRoutes.BOOKING_GRAPH)
                }
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

        composable(BookingRoutes.ADDRESS) { backStackEntry ->
            val bookingEntry =
                remember(backStackEntry) {
                    navController.getBackStackEntry(BookingRoutes.BOOKING_GRAPH)
                }
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

        composable(BookingRoutes.SUMMARY) { backStackEntry ->
            val bookingEntry =
                remember(backStackEntry) {
                    navController.getBackStackEntry(BookingRoutes.BOOKING_GRAPH)
                }
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

        composable(
            route = BookingRoutes.CONFIRMED,
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
            BookingConfirmedScreen(
                bookingId = bookingId,
                onBackToHome = {
                    navController.popBackStack(CatalogueRoutes.HOME, inclusive = false)
                },
            )
        }
    }
}
