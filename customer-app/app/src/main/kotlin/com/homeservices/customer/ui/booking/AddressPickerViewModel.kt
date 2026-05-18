package com.homeservices.customer.ui.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.places.PlacePrediction
import com.homeservices.customer.domain.places.PlacesAutocompleteUseCase
import com.homeservices.customer.domain.places.ReverseGeocoder
import com.homeservices.customer.domain.serviceArea.LocalServiceAreaCheck
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val QUERY_DEBOUNCE_MS = 300L
private const val DRAG_DEBOUNCE_MS = 500L
private const val MIN_QUERY_LENGTH = 3

/**
 * ViewModel for the address-picker flow.
 *
 * Query changes are debounced [QUERY_DEBOUNCE_MS] ms.
 * Marker drags are debounced [DRAG_DEBOUNCE_MS] ms.
 *
 * Accepts [defaultDispatcher] as a constructor parameter so unit tests can inject
 * a [StandardTestDispatcher] without Hilt or CoroutineRule gymnastics.
 */
@OptIn(FlowPreview::class)
@HiltViewModel
public class AddressPickerViewModel @Inject constructor(
    private val placesUseCase: PlacesAutocompleteUseCase,
    private val serviceAreaCheck: LocalServiceAreaCheck,
    private val geocoder: ReverseGeocoder,
    private val defaultDispatcher: CoroutineDispatcher = Dispatchers.Default,
) : ViewModel() {

    private val _uiState = MutableStateFlow<AddressPickerUiState>(AddressPickerUiState.Idle)
    public val uiState: StateFlow<AddressPickerUiState> = _uiState.asStateFlow()

    private val _navEvents = MutableSharedFlow<AddressPickerNavEvent>(extraBufferCapacity = 1)
    public val navEvents: SharedFlow<AddressPickerNavEvent> = _navEvents.asSharedFlow()

    private val _queryFlow = MutableStateFlow("")
    private val _dragFlow = MutableStateFlow<Pair<Double, Double>?>(null)

    init {
        viewModelScope.launch(defaultDispatcher) {
            _queryFlow
                .debounce(QUERY_DEBOUNCE_MS)
                .distinctUntilChanged()
                .collect { query -> handleDebouncedQuery(query) }
        }

        viewModelScope.launch(defaultDispatcher) {
            _dragFlow
                .debounce(DRAG_DEBOUNCE_MS)
                .filter { it != null }
                .distinctUntilChanged()
                .collect { coords ->
                    coords?.let { (lat, lng) -> handleDebouncedDrag(lat, lng) }
                }
        }
    }

    /** Called on every keystroke from the search field. */
    public fun onQueryChange(query: String) {
        _queryFlow.value = query
    }

    /** Called when the user taps a prediction row. */
    public fun onPredictionSelected(prediction: PlacePrediction) {
        viewModelScope.launch(defaultDispatcher) {
            placesUseCase.fetchPlace(prediction.placeId).fold(
                onSuccess = { resolved ->
                    val inService = serviceAreaCheck.isInside(resolved.lat, resolved.lng)
                    _uiState.value = AddressPickerUiState.Selected(
                        formattedAddress = resolved.formattedAddress,
                        lat = resolved.lat,
                        lng = resolved.lng,
                        isInService = inService,
                    )
                },
                onFailure = { ex ->
                    _uiState.value = AddressPickerUiState.Error(
                        reason = ex.message ?: "Failed to resolve place",
                    )
                },
            )
        }
    }

    /** Called on every marker drag event; internally debounced. */
    public fun onMarkerDragEnd(lat: Double, lng: Double) {
        _dragFlow.value = Pair(lat, lng)
    }

    /**
     * Confirm the currently selected address.
     *
     * Emits [AddressPickerNavEvent.NavigateToBookingSummary] when in-service,
     * [AddressPickerNavEvent.NavigateToWaitlist] when out-of-area.
     */
    public fun onConfirm(serviceId: String) {
        when (val state = _uiState.value) {
            is AddressPickerUiState.Selected -> {
                if (state.isInService) {
                    _navEvents.tryEmit(
                        AddressPickerNavEvent.NavigateToBookingSummary(
                            formattedAddress = state.formattedAddress,
                            lat = state.lat,
                            lng = state.lng,
                        ),
                    )
                } else {
                    _navEvents.tryEmit(
                        AddressPickerNavEvent.NavigateToWaitlist(
                            lat = state.lat,
                            lng = state.lng,
                            serviceId = serviceId,
                        ),
                    )
                }
            }
            is AddressPickerUiState.RefusedOutOfArea -> {
                _navEvents.tryEmit(
                    AddressPickerNavEvent.NavigateToWaitlist(
                        lat = state.lat,
                        lng = state.lng,
                        serviceId = serviceId,
                    ),
                )
            }
            else -> { /* no-op for Idle / Searching / PredictionsAvailable / Error */ }
        }
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private suspend fun handleDebouncedQuery(query: String) {
        if (query.length < MIN_QUERY_LENGTH) {
            _uiState.value = AddressPickerUiState.Idle
            return
        }

        _uiState.value = AddressPickerUiState.Searching(query)

        placesUseCase.findPredictions(query).fold(
            onSuccess = { predictions ->
                _uiState.value = AddressPickerUiState.PredictionsAvailable(
                    query = query,
                    predictions = predictions,
                )
            },
            onFailure = { ex ->
                _uiState.value = AddressPickerUiState.Error(
                    reason = ex.message ?: "Search failed",
                )
            },
        )
    }

    private suspend fun handleDebouncedDrag(lat: Double, lng: Double) {
        val inService = serviceAreaCheck.isInside(lat, lng)

        if (!inService) {
            _uiState.value = AddressPickerUiState.RefusedOutOfArea(lat = lat, lng = lng)
            return
        }

        // Reverse-geocode to get a human-readable address for the dragged pin
        val address = geocoder.reverseGeocode(lat, lng)
            .getOrNull()
            ?: "Lat $lat, Lng $lng"

        _uiState.value = AddressPickerUiState.Selected(
            formattedAddress = address,
            lat = lat,
            lng = lng,
            isInService = true,
        )
    }
}
