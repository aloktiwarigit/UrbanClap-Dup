package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.location.FusedCurrentLocationProvider
import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
import com.homeservices.customer.domain.catalogue.GetServiceDetailUseCase
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.customer.domain.technician.GetConfidenceScoreUseCase
import com.homeservices.customer.observability.analytics.AnalyticsEvents
import com.homeservices.customer.observability.analytics.AnalyticsFacade
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
@Suppress("LongParameterList")
internal class ServiceDetailViewModel
    @Inject
    constructor(
        savedStateHandle: SavedStateHandle,
        private val getServiceDetail: GetServiceDetailUseCase,
        private val getConfidenceScore: GetConfidenceScoreUseCase,
        private val locationProvider: FusedCurrentLocationProvider,
        private val localizer: CatalogueLocalizer,
        private val getCurrentLocale: GetCurrentLocaleUseCase,
        private val analytics: AnalyticsFacade,
    ) : ViewModel() {
        private val serviceId: String = checkNotNull(savedStateHandle["serviceId"])
        private val technicianId: String? = savedStateHandle["techId"]

        private val _uiState = MutableStateFlow<ServiceDetailUiState>(ServiceDetailUiState.Loading)
        public val uiState: StateFlow<ServiceDetailUiState> = _uiState.asStateFlow()

        private val _confidenceScoreState =
            MutableStateFlow<ConfidenceScoreUiState>(
                if (technicianId != null) ConfidenceScoreUiState.Loading else ConfidenceScoreUiState.Hidden,
            )
        public val confidenceScoreState: StateFlow<ConfidenceScoreUiState> = _confidenceScoreState.asStateFlow()

        /** Exposed so the screen can drive [TrustDossierViewModel.loadProfile]. */
        public val recommendedTechnicianId: StateFlow<String?> = MutableStateFlow(technicianId).asStateFlow()

        private val retryTrigger = MutableStateFlow(0)

        init {
            viewModelScope.launch {
                retryTrigger
                    .flatMapLatest {
                        combine(getServiceDetail(serviceId), getCurrentLocale()) { result, locale ->
                            result.fold(
                                onSuccess = { service ->
                                    runCatching {
                                        analytics.track(
                                            AnalyticsEvents.SERVICE_VIEW,
                                            mapOf("service_id" to serviceId),
                                        )
                                    }
                                    ServiceDetailUiState.Success(localizer.localizeService(service, locale))
                                },
                                onFailure = { ServiceDetailUiState.Error(it.message ?: "Unknown error") },
                            )
                        }
                    }.collect { state -> _uiState.value = state }
            }
            if (technicianId != null) {
                viewModelScope.launch {
                    retryTrigger
                        .flatMapLatest {
                            val (lat, lng) = resolveGps()
                            getConfidenceScore(technicianId, lat, lng)
                        }.collect { result ->
                            _confidenceScoreState.value =
                                result.fold(
                                    onSuccess = { score ->
                                        if (score.isLimitedData) {
                                            ConfidenceScoreUiState.Limited
                                        } else {
                                            ConfidenceScoreUiState.Loaded(score)
                                        }
                                    },
                                    onFailure = { ConfidenceScoreUiState.Hidden },
                                )
                        }
                }
            }
        }

        /**
         * Attempts to read the device's last GPS fix via [FusedCurrentLocationProvider].
         * Falls back to the (0.0, 0.0) sentinel when location is unavailable (permission denied,
         * GPS off, or no cached fix). The API still returns a score with reduced accuracy.
         */
        private suspend fun resolveGps(): Pair<Double, Double> =
            try {
                locationProvider.getLastLocation() ?: Pair(0.0, 0.0)
            } catch (_: Exception) {
                Pair(0.0, 0.0)
            }

        /**
         * Re-fetches the service **and** the confidence score. Both coroutines are keyed off the
         * same trigger — a retry that re-fired only the detail would leave a stale confidence row
         * behind it.
         */
        public fun retry() {
            _uiState.value = ServiceDetailUiState.Loading
            if (technicianId != null) {
                _confidenceScoreState.value = ConfidenceScoreUiState.Loading
            }
            retryTrigger.value += 1
        }
    }
