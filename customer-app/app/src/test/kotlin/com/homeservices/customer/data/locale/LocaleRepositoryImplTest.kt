package com.homeservices.customer.data.locale

import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
public class LocaleRepositoryImplTest {
    @get:Rule
    public val tempFolder: TemporaryFolder = TemporaryFolder()

    private lateinit var repo: LocaleRepositoryImpl

    @Before
    public fun setUp() {
        val dataStore = PreferenceDataStoreFactory.create {
            tempFolder.newFolder().resolve("locale_prefs.preferences_pb")
        }
        repo = LocaleRepositoryImpl(dataStore)
    }

    @Test
    public fun `currentLocale defaults to en when nothing is stored`(): Unit = runTest {
        assertThat(repo.currentLocale.first()).isEqualTo("en")
    }

    @Test
    public fun `firstLaunchPending defaults to true when nothing is stored`(): Unit = runTest {
        assertThat(repo.firstLaunchPending.first()).isTrue()
    }

    @Test
    public fun `setLocale persists the tag`(): Unit = runTest {
        repo.setLocale("hi")
        assertThat(repo.currentLocale.first()).isEqualTo("hi")
    }

    @Test
    public fun `markFirstLaunchCompleted flips firstLaunchPending to false`(): Unit = runTest {
        repo.markFirstLaunchCompleted()
        assertThat(repo.firstLaunchPending.first()).isFalse()
    }

    @Test
    public fun `setLocale does not flip firstLaunchPending on its own`(): Unit = runTest {
        repo.setLocale("hi")
        assertThat(repo.firstLaunchPending.first()).isTrue()
    }
}
