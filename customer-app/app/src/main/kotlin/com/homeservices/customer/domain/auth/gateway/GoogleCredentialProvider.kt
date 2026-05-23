package com.homeservices.customer.domain.auth.gateway

import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.model.GoogleSignInResult

public interface GoogleCredentialProvider {
    public suspend fun getCredential(activity: FragmentActivity): GoogleSignInResult
}
