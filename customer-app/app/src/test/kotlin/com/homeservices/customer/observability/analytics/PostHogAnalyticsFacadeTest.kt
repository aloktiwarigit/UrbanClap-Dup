package com.homeservices.customer.observability.analytics

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.homeservices.customer.di.BuildInfoProvider
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkAll
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Unit tests for [PostHogAnalyticsFacade].
 *
 * [PostHogAndroid] is mocked via mockkObject so that setup() never touches the network.
 * The key observable is the internal [posthogReady] flag:
 *  - false initially
 *  - stays false when consent=false or key is blank
 *  - becomes true after initIfConsented(true) with a non-blank key
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], manifest = Config.NONE)
public class PostHogAnalyticsFacadeTest {
    private lateinit var context: Context

    @Before
    public fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        mockkObject(PostHogAndroid)
        every { PostHogAndroid.setup(any(), any<PostHogAndroidConfig>()) } returns Unit
    }

    @After
    public fun tearDown() {
        unmockkAll()
    }

    private fun buildFacade(apiKey: String): PostHogAnalyticsFacade {
        val buildInfo = mockk<BuildInfoProvider> { every { postHogApiKey } returns apiKey }
        return PostHogAnalyticsFacade(context, buildInfo)
    }

    private fun posthogReady(facade: PostHogAnalyticsFacade): Boolean {
        val field = PostHogAnalyticsFacade::class.java.getDeclaredField("posthogReady")
        field.isAccessible = true
        return field.getBoolean(facade)
    }

    @Test
    public fun `posthogReady is false initially`() {
        val sut = buildFacade("ph-test-key")
        assertThat(posthogReady(sut)).isFalse()
    }

    @Test
    public fun `initIfConsented false does not set posthogReady`() {
        val sut = buildFacade("ph-test-key")
        sut.initIfConsented(false)
        assertThat(posthogReady(sut)).isFalse()
    }

    @Test
    public fun `initIfConsented true with blank key does not set posthogReady`() {
        val sut = buildFacade("")
        sut.initIfConsented(true)
        assertThat(posthogReady(sut)).isFalse()
    }

    @Test
    public fun `initIfConsented true with non-blank key sets posthogReady`() {
        val sut = buildFacade("ph-test-key-abc123")
        sut.initIfConsented(true)
        assertThat(posthogReady(sut)).isTrue()
    }

    @Test
    public fun `track is no-op when posthogReady is false`() {
        val sut = buildFacade("ph-test-key")
        // posthogReady is false — track should not throw
        sut.track("test_event")
    }

    @Test
    public fun `identify is no-op when posthogReady is false`() {
        val sut = buildFacade("ph-test-key")
        sut.identify("user-123")
    }

    @Test
    public fun `reset is no-op when posthogReady is false`() {
        val sut = buildFacade("ph-test-key")
        sut.reset()
    }

    @Test
    public fun `second initIfConsented true call is idempotent`() {
        val sut = buildFacade("ph-test-key-abc123")
        sut.initIfConsented(true)
        sut.initIfConsented(true)
        assertThat(posthogReady(sut)).isTrue()
    }
}
