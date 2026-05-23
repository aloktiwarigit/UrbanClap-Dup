# Pattern: Synchronous locale init in Application.onCreate (Compose)

**Problem:** `AppCompatDelegate.setApplicationLocales()` must be called before `Activity.setContent {}` 
or the first Compose frame renders in the wrong language. DataStore is async; calling 
`currentLocale.first()` in a coroutine on `Dispatchers.Main.immediate` does not guarantee 
completion before `MainActivity.onCreate()` runs on the same thread.

**Root cause:** `flow.first()` suspends until the DataStore file is read from disk. Even on 
`Dispatchers.Main.immediate`, the coroutine yields at the suspension point. `MainActivity.onCreate()` 
runs in the same message-loop slot and is not blocked, so `setContent {}` races with 
`setApplicationLocales()`.

**Fix pattern — SharedPreferences mirror:**

1. Write a plain `SharedPreferences` mirror entry on every `setLocale()` call:

```kotlin
// LocaleRepositoryImpl.setLocale()
override suspend fun setLocale(tag: String) {
    context.getSharedPreferences(MIRROR_PREFS, Context.MODE_PRIVATE)
        .edit().putString(MIRROR_KEY, tag).apply()   // synchronous write, no suspension
    dataStore.edit { prefs -> prefs[KEY_LOCALE_TAG] = tag }
}
```

2. Read the mirror synchronously in `Application.onCreate()` **before** any coroutine is launched:

```kotlin
override fun onCreate() {
    super.onCreate()
    // Synchronous mirror read — eliminates first-frame language flash
    val syncTag = LocaleRepositoryImpl.readMirrorLocale(this)
        ?: LocaleRepositoryImpl.DEFAULT_LOCALE   // default on first install
    AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(syncTag))

    // Async reconciliation in case mirror lags DataStore (e.g. crashed before apply())
    CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate).launch {
        val tag = localeEp.localeRepository().currentLocale.first()
        if (tag != syncTag) {
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
        }
    }
}
```

**Why `SharedPreferences.apply()` is safe here:** `apply()` is asynchronous relative to the 
calling thread but it writes to an in-memory cache immediately and queues the disk write. A 
subsequent `getString()` on the same `SharedPreferences` instance reads from the in-memory 
cache, so it is consistent even before the disk write completes — as long as the process does 
not die in the window between `apply()` and disk flush (extremely unlikely for a locale write).

**First-install behaviour:** On first install, no mirror exists. `readMirrorLocale()` returns 
`null`; `Application.onCreate` falls back to `DEFAULT_LOCALE` (`"hi"` for the Ayodhya/UP pilot). 
This is correct: the first frame is in Hindi, which matches the onboarding intent.

**Do not use `runBlocking` here:** `runBlocking` on `Main` blocks the message loop and can 
cause ANR if DataStore disk I/O is slow (cold boot, first install, encrypted storage). The 
SharedPreferences-mirror approach avoids this entirely.

**Files implementing this pattern:**
- `data/locale/LocaleRepositoryImpl.kt` — mirror write in `setLocale()`, `readMirrorLocale()` companion fn
- `HomeservicesTechnicianApplication.kt` — synchronous read + async reconciliation

**Tests:**
- `LocaleRepositoryImplTest.kt` — verifies mirror write on `setLocale()`
- `SetAppLocaleUseCaseTest.kt` — verifies `setLocale` is called before `setApplicationLocales`
