package com.homeservices.customer

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.di.BuildInfoProvider
import com.homeservices.customer.navigation.AppNavigation
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.truecaller.android.sdk.legacy.TruecallerSDK
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class MainActivity : FragmentActivity() {
    @Inject public lateinit var buildInfo: BuildInfoProvider
    @Inject public lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HomeservicesTheme {
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                )
            }
        }
    }

    /**
     * Truecaller SDK 3.x delivers the one-tap result via the legacy onActivityResult path.
     * @Suppress DEPRECATION because the SDK has not yet migrated to ActivityResultContracts.
     */
    @Suppress("DEPRECATION")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == TruecallerSDK.SHARE_PROFILE_REQUEST_CODE) {
            TruecallerSDK.getInstance().onActivityResultObtained(
                this, requestCode, resultCode, data,
            )
        }
    }
}
