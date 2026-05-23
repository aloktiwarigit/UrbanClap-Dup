package com.homeservices.technician.domain.erasure

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class SubmitErasureRequestUseCase
    @Inject
    constructor(
        private val erasureRepository: ErasureRepository,
    ) {
        public suspend operator fun invoke(reason: String? = null): ErasureSubmitResult = erasureRepository.submitRequest(reason)
    }
