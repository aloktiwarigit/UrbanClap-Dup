package com.homeservices.customer.domain.auth

import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.gateway.GoogleCredentialProvider
import com.homeservices.customer.domain.auth.model.GoogleSignInResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class GoogleSignInUseCase
    @Inject
    constructor(
        private val provider: GoogleCredentialProvider,
    ) {
        public suspend fun getCredential(activity: FragmentActivity): GoogleSignInResult =
            provider.getCredential(activity)
    }
