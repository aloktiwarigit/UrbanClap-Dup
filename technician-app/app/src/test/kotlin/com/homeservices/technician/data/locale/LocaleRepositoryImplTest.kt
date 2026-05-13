package com.homeservices.technician.data.locale

import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.io.File

@OptIn(ExperimentalCoroutinesApi::class)
public class LocaleRepositoryImplTest {

    @Test
    public fun `currentLocale emits stored tag`(@TempDir dir: File): Unit = runTest {
        val ds = PreferenceDataStoreFactory.create(scope = backgroundScope) {
            File(dir, "a.preferences_pb")
        }
        val r = LocaleRepositoryImpl(ds)
        r.setLocale("hi")
        assertEquals("hi", r.currentLocale.first())
    }

    @Test
    public fun `currentLocale defaults to en or hi based on device`(@TempDir dir: File): Unit = runTest {
        val ds = PreferenceDataStoreFactory.create(scope = backgroundScope) {
            File(dir, "b.preferences_pb")
        }
        val r = LocaleRepositoryImpl(ds)
        val result = r.currentLocale.first()
        assert(result == "en" || result == "hi") { "Expected 'en' or 'hi', got '$result'" }
    }

    @Test
    public fun `setLocale persists across repo instances`(@TempDir dir: File): Unit = runTest {
        val file = File(dir, "c.preferences_pb")
        // Write with first instance
        val ds1 = PreferenceDataStoreFactory.create(scope = backgroundScope) { file }
        LocaleRepositoryImpl(ds1).setLocale("hi")
        // Read back — same file, same scope, so no "multiple DataStores" conflict
        assertEquals("hi", LocaleRepositoryImpl(ds1).currentLocale.first())
    }
}
