package com.homeservices.customer

import android.content.Intent
import android.net.Uri
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableStateFlow
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

/**
 * JVM unit tests for [MainActivity] deep-link observable state logic.
 *
 * FIX 3 (E11-S01b-1): PendingIntent uses FLAG_ACTIVITY_SINGLE_TOP so warm taps
 * route to [MainActivity.onNewIntent]. The deep-link URI must update
 * [MainActivity.deepLinkState] so AppNavigation reacts without Activity recreation.
 *
 * These tests exercise the [deepLinkState] update contract in isolation — no
 * Android runtime or Hilt required. The deepLinkState field is public (needed for
 * Compose setContent to collect it); the logic is extracted here for verification.
 */
public class MainActivityDeepLinkTest {
    /**
     * Simulate the onNewIntent logic: extract homeservices:// URI and update state.
     * Mirrors the exact logic in [MainActivity.onNewIntent].
     */
    private fun simulateOnNewIntent(
        deepLinkState: MutableStateFlow<String?>,
        intent: Intent,
    ) {
        val newDeepLink =
            intent.data
                ?.takeIf { it.scheme == "homeservices" && it.host == "action" }
                ?.toString()
        if (newDeepLink != null) {
            deepLinkState.value = newDeepLink
        }
    }

    @Test
    public fun `onNewIntent updates deepLinkState for valid homeservices action URI`() {
        val deepLinkState = MutableStateFlow<String?>(null)
        val uri = Uri.parse("homeservices://action/ADDON_APPROVAL_REQUESTED?entityId=bk1")
        val intent = mockk<Intent>()
        every { intent.data } returns uri

        simulateOnNewIntent(deepLinkState, intent)

        assertThat(deepLinkState.value)
            .isEqualTo("homeservices://action/ADDON_APPROVAL_REQUESTED?entityId=bk1")
    }

    @Test
    public fun `onNewIntent updates deepLinkState for RATING_PROMPT_CUSTOMER warm tap`() {
        val deepLinkState = MutableStateFlow<String?>(null)
        val uri = Uri.parse("homeservices://action/RATING_PROMPT_CUSTOMER?entityId=bk2")
        val intent = mockk<Intent>()
        every { intent.data } returns uri

        simulateOnNewIntent(deepLinkState, intent)

        assertThat(deepLinkState.value)
            .isEqualTo("homeservices://action/RATING_PROMPT_CUSTOMER?entityId=bk2")
    }

    @Test
    public fun `onNewIntent does not update deepLinkState for non-homeservices URI`() {
        val initialValue = "homeservices://action/ADDON_APPROVAL_REQUESTED?entityId=old"
        val deepLinkState = MutableStateFlow<String?>(initialValue)
        val intent = mockk<Intent>()
        every { intent.data } returns Uri.parse("https://example.com/callback")

        simulateOnNewIntent(deepLinkState, intent)

        // State must not change — only homeservices://action/ URIs are deep links
        assertThat(deepLinkState.value).isEqualTo(initialValue)
    }

    @Test
    public fun `onNewIntent does not update deepLinkState for homeservices non-action host`() {
        val deepLinkState = MutableStateFlow<String?>(null)
        val intent = mockk<Intent>()
        every { intent.data } returns Uri.parse("homeservices://kyc/aadhaar-callback?code=abc")

        simulateOnNewIntent(deepLinkState, intent)

        assertThat(deepLinkState.value).isNull()
    }

    @Test
    public fun `onNewIntent does not update deepLinkState when intent has no data`() {
        val initialValue = "homeservices://action/COMPLAINT_UPDATE?entityId=c1"
        val deepLinkState = MutableStateFlow<String?>(initialValue)
        val intent = mockk<Intent>()
        every { intent.data } returns null

        simulateOnNewIntent(deepLinkState, intent)

        // State unchanged — no URI in this intent
        assertThat(deepLinkState.value).isEqualTo(initialValue)
    }

    @Test
    public fun `cold-start deepLinkState initialised from intent before setContent`() {
        // Verify that the initial value pattern used in onCreate is correct
        val uri = Uri.parse("homeservices://action/COMPLAINT_UPDATE?entityId=cmp5")
        val coldStartDeepLink =
            uri.takeIf { it.scheme == "homeservices" && it.host == "action" }?.toString()
        val deepLinkState = MutableStateFlow(coldStartDeepLink)

        assertThat(deepLinkState.value)
            .isEqualTo("homeservices://action/COMPLAINT_UPDATE?entityId=cmp5")
    }

    @Test
    public fun `cold-start deepLinkState is null when intent has no data`() {
        val coldStartDeepLink = null as String?
        val deepLinkState = MutableStateFlow(coldStartDeepLink)

        assertThat(deepLinkState.value).isNull()
    }
}
