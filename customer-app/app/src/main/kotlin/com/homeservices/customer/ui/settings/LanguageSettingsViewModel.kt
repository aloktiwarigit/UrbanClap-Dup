package com.homeservices.customer.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.customer.domain.locale.SetAppLocaleUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class LanguageSettingsViewModel
    @Inject
    constructor(
        private val getCurrentLocale: GetCurrentLocaleUseCase,
        private val setAppLocale: SetAppLocaleUseCase,
    ) : ViewModel() {
        private val _selectedTag = MutableStateFlow("en")
        public val selectedTag: StateFlow<String> = _selectedTag.asStateFlow()

        public val savedFlow: MutableStateFlow<Boolean> = MutableStateFlow(false)

        init {
            viewModelScope.launch {
                _selectedTag.value = getCurrentLocale().first()
            }
        }

        public fun onSelect(tag: String) {
            _selectedTag.value = tag
        }

        public fun onSave() {
            viewModelScope.launch {
                setAppLocale(_selectedTag.value)
                savedFlow.value = true
            }
        }
    }
