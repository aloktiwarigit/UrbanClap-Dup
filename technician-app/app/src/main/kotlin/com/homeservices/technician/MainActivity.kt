package com.homeservices.technician

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.fragment.app.FragmentActivity
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.di.BuildInfoProvider
import com.homeservices.technician.navigation.AppNavigation
import com.truecaller.android.sdk.legacy.TruecallerSDK
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class MainActivity : FragmentActivity() {
    @Inject public lateinit var buildInfo: BuildInfoProvider

    @Inject public lateinit var sessionManager: SessionManager

    @Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HomeservicesTheme {
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                    ratingPromptEventBus = ratingPromptEventBus,
                )
            }
        }
    }

    /**
     * Truecaller SDK 3.x delivers the one-tap result via the legacy onActivityResult path.
     * @Suppress DEPRECATION because the SDK has not yet migrated to ActivityResultContracts.
     */
    @Suppress("DEPRECATION")
    override fun onActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == TruecallerSDK.SHARE_PROFILE_REQUEST_CODE) {
            TruecallerSDK.getInstance().onActivityResultObtained(
                this,
                requestCode,
                resultCode,
                data,
            )
        }
    }
}
