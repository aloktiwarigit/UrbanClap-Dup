package com.homeservices.technician

import com.homeservices.technician.di.BuildInfoProvider
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import dagger.hilt.android.testing.HiltTestApplication
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import javax.inject.Inject

@HiltAndroidTest
@RunWith(RobolectricTestRunner::class)
@Config(application = HiltTestApplication::class)
public class HiltWiringTest {
    @get:Rule
    public val hiltRule: HiltAndroidRule = HiltAndroidRule(this)

    @Inject
    public lateinit var buildInfoProvider: BuildInfoProvider

    @org.junit.Test
    public fun hiltGraphResolvesBuildInfoProvider(): Unit {
        hiltRule.inject()
        assertThat(buildInfoProvider).isNotNull
        assertThat(buildInfoProvider.version).isNotBlank
    }
}
