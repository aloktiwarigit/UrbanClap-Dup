package com.homeservices.technician

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.fragment.app.FragmentActivity
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.fcm.FcmTopicSubscriber
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.di.BuildInfoProvider
import com.homeservices.technician.navigation.AppNavigation
import com.truecaller.android.sdk.legacy.TruecallerSDK
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

/**
 * Routes a FCM cold-start navigation extra to the appropriate event bus.
 * Extracted to a top-level function so it can be unit tested without instantiating an Activity.
 */
internal fun navigateFromExtra(
    extra: String?,
    bus: RatingReceivedEventBus,
) {
    if (extra == "ratings_transparency") bus.post()
}

@AndroidEntryPoint
public class MainActivity : FragmentActivity() {
    @Inject public lateinit var buildInfo: BuildInfoProvider

    @Inject public lateinit var sessionManager: SessionManager

    @Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus

    @Inject public lateinit var ratingReceivedEventBus: RatingReceivedEventBus

    @Inject public lateinit var fcmTopicSubscriber: FcmTopicSubscriber

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleNavigationIntent(intent)
        setContent {
            HomeservicesTheme {
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                    ratingPromptEventBus = ratingPromptEventBus,
                    ratingReceivedEventBus = ratingReceivedEventBus,
                    fcmTopicSubscriber = fcmTopicSubscriber,
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleNavigationIntent(intent)
    }

    private fun handleNavigationIntent(intent: Intent?) {
        navigateFromExtra(intent?.getStringExtra("navigate_to"), ratingReceivedEventBus)
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
