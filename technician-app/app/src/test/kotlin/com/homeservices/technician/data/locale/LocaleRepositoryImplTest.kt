package com.homeservices.technician.data.locale

import android.content.Context
import android.content.SharedPreferences
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.io.File

@OptIn(ExperimentalCoroutinesApi::class)
public class LocaleRepositoryImplTest {
    private val mockPrefsEditor: SharedPreferences.Editor = mockk(relaxed = true)
    private val mockPrefs: SharedPreferences =
        mockk(relaxed = true) {
            every { edit() } returns mockPrefsEditor
        }
    private val mockContext: Context =
        mockk(relaxed = true) {
            every { getSharedPreferences(any<String>(), any<Int>()) } returns mockPrefs
        }

    @Test
    public fun `currentLocale emits stored tag`(
        @TempDir dir: File,
    ): Unit =
        runTest {
            val ds =
                PreferenceDataStoreFactory.create(scope = backgroundScope) {
                    File(dir, "a.preferences_pb")
                }
            val r = LocaleRepositoryImpl(ds, mockContext)
            r.setLocale("hi")
            assertEquals("hi", r.currentLocale.first())
        }

    @Test
    public fun `currentLocale defaults to hi when no stored tag`(
        @TempDir dir: File,
    ): Unit =
        runTest {
            val ds =
                PreferenceDataStoreFactory.create(scope = backgroundScope) {
                    File(dir, "b.preferences_pb")
                }
            val r = LocaleRepositoryImpl(ds, mockContext)
            assertEquals("hi", r.currentLocale.first())
        }

    @Test
    public fun `setLocale persists across repo instances`(
        @TempDir dir: File,
    ): Unit =
        runTest {
            val file = File(dir, "c.preferences_pb")
            val ds1 = PreferenceDataStoreFactory.create(scope = backgroundScope) { file }
            LocaleRepositoryImpl(ds1, mockContext).setLocale("hi")
            assertEquals("hi", LocaleRepositoryImpl(ds1, mockContext).currentLocale.first())
        }

    @Test
    public fun `setLocale writes SharedPreferences mirror for synchronous cold-start read`(
        @TempDir dir: File,
    ): Unit =
        runTest {
            val ds =
                PreferenceDataStoreFactory.create(scope = backgroundScope) {
                    File(dir, "d.preferences_pb")
                }
            val r = LocaleRepositoryImpl(ds, mockContext)

            r.setLocale("hi")

            verify { mockPrefsEditor.putString(any(), "hi") }
            verify { mockPrefsEditor.apply() }
        }
}
