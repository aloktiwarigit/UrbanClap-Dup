# Technician App Live Service Catalogue Implementation Plan — Story B

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the technician app's hardcoded 13-service picker with a live `/v1/categories` fetch, and stop the app silently deleting skills it does not recognise.

**Architecture:** Add a `catalogue` feature package mirroring the existing `serviceprofile` one — Retrofit API service, Moshi DTOs, repository interface in `domain` with an impl in `data`, a use case, and a Hilt module. `ServiceSelectionViewModel` fetches the catalogue on load and validates against the fetched ids. Skills the technician has saved that are absent from the fetched catalogue are preserved in a separate `unlistedSkillIds` set and merged back on save, so no fetch failure or catalogue deactivation can destroy a technician's data. `OnboardingGateViewModel` drops its catalogue dependency entirely.

**Tech Stack:** Kotlin, Jetpack Compose, Hilt, Retrofit, Moshi, coroutines, JUnit + Turbine, Paparazzi.

**Spec:** Owner directive, 2026-09-15 — "I want all the services be available to technician and customers both", with the technician picker resolved to "Fetch from /v1/categories". Depends on ADR-0030 (Story A).

## Global Constraints

- Kotlin explicit API mode is on. Every new public declaration needs an explicit `public` / `internal` modifier — see `docs/patterns/kotlin-explicit-api-public-modifier.md`.
- New Hilt-injected classes need test-scope handling — see `docs/patterns/hilt-module-android-test-scope.md`.
- **First task of every technician-app story:** copy `customer-app/gradle/libs.versions.toml` to `technician-app/gradle/libs.versions.toml`.
- Never run `recordPaparazziDebug` on Windows. Use the `paparazzi-record.yml` workflow_dispatch on CI with explicit `gradle_root` and `gradle_task` — both silently default to customer-app when left blank. See `docs/patterns/paparazzi-cross-os-goldens.md`.
- Never delete existing Paparazzi goldens. See `docs/patterns/paparazzi-golden-cleanup`.
- Endpoint shape: `GET /v1/categories` returns `{"categories":[{"id","name","heroImageUrl","sortOrder","safetyTag","services":[{"id","name",...}]}]}`. Only active categories/services are returned, and categories with zero services are omitted by the API.

---

### Task 0: Sync the version catalog

- [ ] **Step 1: Copy the file**

```bash
cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
```

- [ ] **Step 2: Confirm the build still resolves**

Run: `cd technician-app && ./gradlew assembleDebug`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**

```bash
git add technician-app/gradle/libs.versions.toml
git commit -m "chore(technician-app): sync libs.versions.toml from customer-app"
```

---

### Task 1: Catalogue DTOs and API service

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/catalogue/remote/dto/CatalogueDtos.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/catalogue/remote/CatalogueApiService.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/catalogue/model/SelectableService.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/catalogue/CatalogueDtoTest.kt`

**Interfaces:**
- Produces: `SelectableService(id: String, name: String, group: String)`; `CategoriesResponseDto.toDomain(): List<SelectableService>`; `CatalogueApiService.getCategories(): CategoriesResponseDto`

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.data.catalogue

import com.homeservices.technician.data.catalogue.remote.dto.CategoriesResponseDto
import com.squareup.moshi.Moshi
import org.junit.Assert.assertEquals
import org.junit.Test

class CatalogueDtoTest {
    // Plain builder, no KotlinJsonAdapterFactory: the DTOs use
    // @JsonClass(generateAdapter = true), so KSP generates the adapters and Moshi
    // finds them by name. Adding the reflection factory here would pull in
    // moshi-kotlin and mask a missing @JsonClass annotation.
    private val moshi = Moshi.Builder().build()

    @Test
    fun `flattens categories into selectable services tagged with their category name`() {
        val json = """
            {"categories":[
              {"id":"ac-repair","name":"AC Repair","sortOrder":1,"services":[
                {"id":"ac-deep-clean","name":"AC Deep Clean"},
                {"id":"ac-gas-refill","name":"AC Gas Refill"}
              ]},
              {"id":"appliance-repair","name":"Appliance Repair","sortOrder":6,"services":[
                {"id":"appliance-fridge-repair","name":"Fridge Repair"}
              ]}
            ]}
        """.trimIndent()

        val services = moshi.adapter(CategoriesResponseDto::class.java).fromJson(json)!!.toDomain()

        assertEquals(3, services.size)
        assertEquals("ac-deep-clean", services[0].id)
        assertEquals("AC Deep Clean", services[0].name)
        assertEquals("AC Repair", services[0].group)
        assertEquals("Appliance Repair", services[2].group)
    }

    @Test
    fun `tolerates a category with no services array`() {
        val json = """{"categories":[{"id":"empty","name":"Empty","sortOrder":9}]}"""
        val services = moshi.adapter(CategoriesResponseDto::class.java).fromJson(json)!!.toDomain()
        assertEquals(0, services.size)
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*CatalogueDtoTest*"`
Expected: FAIL — `CategoriesResponseDto` unresolved.

- [ ] **Step 3: Write the domain model**

`domain/catalogue/model/SelectableService.kt`:

```kotlin
package com.homeservices.technician.domain.catalogue.model

public data class SelectableService(
    val id: String,
    val name: String,
    val group: String,
)
```

- [ ] **Step 4: Write the DTOs**

`data/catalogue/remote/dto/CatalogueDtos.kt`:

```kotlin
package com.homeservices.technician.data.catalogue.remote.dto

import com.homeservices.technician.domain.catalogue.model.SelectableService
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
internal data class CatalogueServiceDto(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
)

@JsonClass(generateAdapter = true)
internal data class CatalogueCategoryDto(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "sortOrder") val sortOrder: Int = 0,
    @Json(name = "services") val services: List<CatalogueServiceDto>? = null,
)

@JsonClass(generateAdapter = true)
internal data class CategoriesResponseDto(
    @Json(name = "categories") val categories: List<CatalogueCategoryDto>,
) {
    fun toDomain(): List<SelectableService> =
        categories
            .sortedBy { it.sortOrder }
            .flatMap { category ->
                (category.services ?: emptyList()).map { service ->
                    SelectableService(
                        id = service.id,
                        name = service.name,
                        group = category.name,
                    )
                }
            }
}
```

- [ ] **Step 5: Write the API service**

`data/catalogue/remote/CatalogueApiService.kt`:

```kotlin
package com.homeservices.technician.data.catalogue.remote

import com.homeservices.technician.data.catalogue.remote.dto.CategoriesResponseDto
import retrofit2.http.GET

internal interface CatalogueApiService {
    @GET("v1/categories")
    suspend fun getCategories(): CategoriesResponseDto
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*CatalogueDtoTest*"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/catalogue technician-app/app/src/main/kotlin/com/homeservices/technician/domain/catalogue technician-app/app/src/test/kotlin/com/homeservices/technician/data/catalogue
git commit -m "feat(technician-app): catalogue DTOs and API service"
```

---

### Task 2: Repository, use case, and Hilt module

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/catalogue/CatalogueRepository.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/catalogue/CatalogueRepositoryImpl.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/catalogue/GetSelectableServicesUseCase.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/catalogue/di/CatalogueModule.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/catalogue/GetSelectableServicesUseCaseTest.kt`

**Interfaces:**
- Consumes: `CatalogueApiService`, `SelectableService` from Task 1
- Produces: `CatalogueRepository.getSelectableServices(): Result<List<SelectableService>>`; `GetSelectableServicesUseCase.invoke(): Result<List<SelectableService>>`

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.domain.catalogue

import com.homeservices.technician.domain.catalogue.model.SelectableService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class GetSelectableServicesUseCaseTest {
    private class FakeRepository(
        private val result: Result<List<SelectableService>>,
    ) : CatalogueRepository {
        override suspend fun getSelectableServices(): Result<List<SelectableService>> = result
    }

    @Test
    fun `returns services from the repository`() = runTest {
        val expected = listOf(SelectableService("ac-deep-clean", "AC Deep Clean", "AC Repair"))
        val useCase = GetSelectableServicesUseCase(FakeRepository(Result.success(expected)))

        assertEquals(expected, useCase().getOrNull())
    }

    @Test
    fun `propagates failure rather than swallowing it`() = runTest {
        val useCase = GetSelectableServicesUseCase(FakeRepository(Result.failure(IllegalStateException("boom"))))

        assertTrue(useCase().isFailure)
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*GetSelectableServicesUseCaseTest*"`
Expected: FAIL — `CatalogueRepository` unresolved.

- [ ] **Step 3: Write the repository interface, impl, and use case**

`domain/catalogue/CatalogueRepository.kt`:

```kotlin
package com.homeservices.technician.domain.catalogue

import com.homeservices.technician.domain.catalogue.model.SelectableService

public interface CatalogueRepository {
    public suspend fun getSelectableServices(): Result<List<SelectableService>>
}
```

`data/catalogue/CatalogueRepositoryImpl.kt`:

```kotlin
package com.homeservices.technician.data.catalogue

import com.homeservices.technician.data.catalogue.remote.CatalogueApiService
import com.homeservices.technician.domain.catalogue.CatalogueRepository
import com.homeservices.technician.domain.catalogue.model.SelectableService
import javax.inject.Inject

internal class CatalogueRepositoryImpl
    @Inject
    constructor(
        private val apiService: CatalogueApiService,
    ) : CatalogueRepository {
        override suspend fun getSelectableServices(): Result<List<SelectableService>> =
            runCatching { apiService.getCategories().toDomain() }
    }
```

`domain/catalogue/GetSelectableServicesUseCase.kt`:

```kotlin
package com.homeservices.technician.domain.catalogue

import com.homeservices.technician.domain.catalogue.model.SelectableService
import javax.inject.Inject

public class GetSelectableServicesUseCase
    @Inject
    constructor(
        private val repository: CatalogueRepository,
    ) {
        public suspend operator fun invoke(): Result<List<SelectableService>> = repository.getSelectableServices()
    }
```

- [ ] **Step 4: Write the Hilt module**

`data/catalogue/di/CatalogueModule.kt` — mirrors `ServiceProfileModule` exactly:

```kotlin
package com.homeservices.technician.data.catalogue.di

import com.homeservices.technician.data.catalogue.CatalogueRepositoryImpl
import com.homeservices.technician.data.catalogue.remote.CatalogueApiService
import com.homeservices.technician.domain.catalogue.CatalogueRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
internal abstract class CatalogueModule {
    @Binds
    abstract fun bindCatalogueRepository(impl: CatalogueRepositoryImpl): CatalogueRepository

    companion object {
        @Provides
        @Singleton
        fun provideCatalogueApiService(retrofit: Retrofit): CatalogueApiService =
            retrofit.create(CatalogueApiService::class.java)
    }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*GetSelectableServicesUseCaseTest*"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/catalogue technician-app/app/src/main/kotlin/com/homeservices/technician/domain/catalogue technician-app/app/src/test/kotlin/com/homeservices/technician/domain/catalogue
git commit -m "feat(technician-app): catalogue repository, use case, and Hilt module"
```

---

### Task 3: Stop the ViewModel deleting unrecognised skills

This is the data-loss fix. Today `ServiceSelectionViewModel.refresh()` runs `profile.skills.filter { it in validSkillIds }`, so any saved skill outside the hardcoded list is dropped from state and then erased by the next save. `ac-deep-clean-window` is active in production and is being wiped this way right now.

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/serviceprofile/ServiceSelectionUiState.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/serviceprofile/ServiceSelectionViewModel.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/serviceprofile/ServiceSelectionViewModelTest.kt`

**Interfaces:**
- Consumes: `GetSelectableServicesUseCase` from Task 2
- Produces: `ServiceSelectionUiState.services: List<SelectableService>`, `.unlistedSkillIds: Set<String>`

- [ ] **Step 1: Write the failing test**

```kotlin
@Test
fun `preserves saved skills that are absent from the fetched catalogue`() = runTest {
    // Catalogue offers only ac-deep-clean; the technician has also saved
    // ac-deep-clean-window, which the fetched catalogue does not list.
    val vm = viewModelWith(
        catalogue = listOf(SelectableService("ac-deep-clean", "AC Deep Clean", "AC Repair")),
        savedSkills = listOf("ac-deep-clean", "ac-deep-clean-window"),
    )
    advanceUntilIdle()

    assertEquals(setOf("ac-deep-clean"), vm.uiState.value.selectedSkillIds)
    assertEquals(setOf("ac-deep-clean-window"), vm.uiState.value.unlistedSkillIds)

    vm.save()
    advanceUntilIdle()

    // The saved payload must still contain the unlisted skill.
    assertEquals(
        setOf("ac-deep-clean", "ac-deep-clean-window"),
        savedProfile!!.skills.toSet(),
    )
}

@Test
fun `keeps every saved skill when the catalogue fetch fails`() = runTest {
    val vm = viewModelWith(
        catalogue = null, // fetch fails
        savedSkills = listOf("ac-deep-clean", "appliance-fridge-repair"),
    )
    advanceUntilIdle()

    vm.save()
    advanceUntilIdle()

    assertEquals(
        setOf("ac-deep-clean", "appliance-fridge-repair"),
        savedProfile!!.skills.toSet(),
    )
}
```

With this helper in the same test class:

```kotlin
    private var savedProfile: ServiceProfile? = null

    private fun TestScope.viewModelWith(
        catalogue: List<SelectableService>?,
        savedSkills: List<String>,
    ): ServiceSelectionViewModel {
        savedProfile = null
        val profile = ServiceProfile(
            skills = savedSkills,
            location = ServiceLocation(lat = 26.7922, lng = 82.1998),
        )
        val getProfile = object : GetServiceProfileUseCase(FakeProfileRepository(profile)) {}
        val saveProfile = object : SaveServiceProfileUseCase(FakeProfileRepository(profile)) {
            override suspend fun invoke(p: ServiceProfile): Result<ServiceProfile> {
                savedProfile = p
                return Result.success(p)
            }
        }
        val getServices = object : GetSelectableServicesUseCase(
            FakeCatalogueRepository(
                catalogue?.let { Result.success(it) }
                    ?: Result.failure(IllegalStateException("offline")),
            ),
        ) {}
        return ServiceSelectionViewModel(getProfile, saveProfile, getServices)
    }
```

If the existing use-case classes are `final` and cannot be subclassed, make the ViewModel depend on the repository interfaces instead, or open the use cases — do not change production behaviour to suit the test. Follow whichever fake style `GetServiceProfileUseCaseTest` already establishes in this module and stay consistent with it.

- [ ] **Step 2: Run it to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*ServiceSelectionViewModelTest*"`
Expected: FAIL — `unlistedSkillIds` unresolved, and the save assertion fails because the current code drops the unlisted skill.

- [ ] **Step 3: Update the UI state**

In `ServiceSelectionUiState.kt`, change the import and the first field, and add `unlistedSkillIds`:

```kotlin
package com.homeservices.technician.ui.serviceprofile

import com.homeservices.technician.domain.catalogue.model.SelectableService

internal data class ServiceSelectionUiState(
    val services: List<SelectableService> = emptyList(),
    val selectedSkillIds: Set<String> = emptySet(),
    // Skills the technician has saved that the fetched catalogue does not list — for
    // example a service deactivated after they selected it, or any skill at all when
    // the catalogue fetch fails. Held here and merged back on save so the app can
    // never silently delete a technician's skill.
    val unlistedSkillIds: Set<String> = emptySet(),
    val serviceLat: Double? = null,
    val serviceLng: Double? = null,
    val serviceAreaLabel: String = "Service area not set",
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val isLocating: Boolean = false,
    val errorMessage: String? = null,
    val saved: Boolean = false,
    val existingCompleteProfileLoaded: Boolean = false,
)
```

Leave `DEFAULT_SERVICE_LAT` / `DEFAULT_SERVICE_LNG` unchanged.

- [ ] **Step 4: Rewrite the ViewModel's load path**

In `ServiceSelectionViewModel.kt`, inject the new use case and replace the `validSkillIds` field and `refresh()` body:

```kotlin
@HiltViewModel
internal class ServiceSelectionViewModel
    @Inject
    constructor(
        private val getServiceProfile: GetServiceProfileUseCase,
        private val saveServiceProfile: SaveServiceProfileUseCase,
        private val getSelectableServices: GetSelectableServicesUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow(ServiceSelectionUiState())
        val uiState: StateFlow<ServiceSelectionUiState> = _uiState.asStateFlow()

        init {
            refresh()
        }

        fun refresh(): Unit {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            viewModelScope.launch {
                val services = getSelectableServices().getOrElse { emptyList() }
                val catalogueIds = services.map { it.id }.toSet()
                val outcome = getServiceProfile()
                _uiState.value =
                    outcome.fold(
                        onSuccess = { profile ->
                            // Partition rather than filter: skills the catalogue does not
                            // list are preserved in unlistedSkillIds and merged back on
                            // save. Filtering them away here is what deleted them before.
                            val (listed, unlisted) = profile.skills.partition { it in catalogueIds }
                            _uiState.value.copy(
                                services = services,
                                selectedSkillIds = listed.toSet(),
                                unlistedSkillIds = unlisted.toSet(),
                                serviceLat = profile.location?.lat,
                                serviceLng = profile.location?.lng,
                                serviceAreaLabel =
                                    if (profile.location == null) {
                                        "Service area not set"
                                    } else {
                                        "Saved service area"
                                    },
                                isLoading = false,
                                errorMessage =
                                    if (services.isEmpty()) {
                                        "Could not load the service list. Pull to retry."
                                    } else {
                                        null
                                    },
                                existingCompleteProfileLoaded =
                                    (listed.isNotEmpty() || unlisted.isNotEmpty()) &&
                                        profile.location?.let { validateLocation(it.lat, it.lng) == null } == true,
                            )
                        },
                        onFailure = {
                            _uiState.value.copy(
                                services = services,
                                isLoading = false,
                                errorMessage = "Could not load your saved services. You can still save this form.",
                                existingCompleteProfileLoaded = false,
                            )
                        },
                    )
            }
        }

        fun toggleSkill(skillId: String): Unit {
            val current = _uiState.value
            // Only catalogue-listed services are toggleable; unlisted ones are held
            // untouched in unlistedSkillIds.
            if (current.services.none { it.id == skillId }) return
            val selected =
                if (skillId in current.selectedSkillIds) {
                    current.selectedSkillIds - skillId
                } else {
                    current.selectedSkillIds + skillId
                }
            _uiState.value = current.copy(selectedSkillIds = selected)
        }
```

- [ ] **Step 5: Merge unlisted skills back on save**

Find the `save()` function and change the skills it submits from `uiState.value.selectedSkillIds.toList()` to:

```kotlin
            skills = (state.selectedSkillIds + state.unlistedSkillIds).toList(),
```

where `state` is the `ServiceSelectionUiState` already read in `save()`. If `save()` reads `_uiState.value` inline, bind it to a local `val state = _uiState.value` first so both sets come from one snapshot.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*ServiceSelectionViewModelTest*"`
Expected: PASS.

- [ ] **Step 7: Prove the fix is non-vacuous**

Temporarily revert Step 5 (submit only `selectedSkillIds`), re-run the tests, and confirm `preserves saved skills that are absent from the fetched catalogue` FAILS. Restore Step 5 and confirm it passes again. Do not commit the temporary revert.

- [ ] **Step 8: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/serviceprofile technician-app/app/src/test/kotlin/com/homeservices/technician/ui/serviceprofile
git commit -m "fix(technician-app): stop deleting skills absent from the hardcoded catalogue"
```

---

### Task 4: Point the screen at the fetched catalogue and delete the hardcoded list

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/serviceprofile/ServiceSelectionScreen.kt:226,255`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/OnboardingGateViewModel.kt:8,27,47-49`
- Delete: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/serviceprofile/ServiceCatalogue.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/navigation/OnboardingGateViewModelTest.kt`

- [ ] **Step 1: Write the failing OnboardingGate test**

```kotlin
@Test
fun `treats a profile as complete when its only skill is outside the old hardcoded list`() = runTest {
    // appliance-fridge-repair was never in ServiceCatalogue.items. Before this change
    // such a technician was pushed back through onboarding forever.
    val vm = gateViewModelWith(
        skills = listOf("appliance-fridge-repair"),
        lat = 26.7922,
        lng = 82.1998,
    )
    advanceUntilIdle()

    assertEquals(OnboardingGateUiState.Complete, vm.uiState.value)
}

@Test
fun `still treats a skill-less profile as needing onboarding`() = runTest {
    val vm = gateViewModelWith(skills = emptyList(), lat = 26.7922, lng = 82.1998)
    advanceUntilIdle()

    assertEquals(OnboardingGateUiState.NeedsOnboarding, vm.uiState.value)
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*OnboardingGateViewModelTest*"`
Expected: FAIL on the first test — the gate reports `NeedsOnboarding` because `appliance-fridge-repair` is not in `validSkillIds`.

- [ ] **Step 3: Drop the catalogue dependency from the gate**

In `OnboardingGateViewModel.kt`, remove the `import com.homeservices.technician.ui.serviceprofile.ServiceCatalogue` line and the `validSkillIds` property, then change `isComplete()` to:

```kotlin
        // Completeness means "has at least one skill and a valid location". It
        // deliberately does not check the skill against a catalogue: the gate must not
        // make a network call, and a skill the client cannot name is still a skill.
        private fun ServiceProfile.isComplete(): Boolean =
            skills.isNotEmpty() &&
                location?.isValid() == true
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*OnboardingGateViewModelTest*"`
Expected: PASS.

- [ ] **Step 5: Swap the screen's type**

In `ServiceSelectionScreen.kt`, replace the import of `ServiceCatalogueItem` with `com.homeservices.technician.domain.catalogue.model.SelectableService`, and change the two parameter types at lines 226 and 255 from `List<ServiceCatalogueItem>` / `ServiceCatalogueItem` to `List<SelectableService>` / `SelectableService`. The field names (`id`, `name`, `group`) are identical, so no body changes are needed.

- [ ] **Step 6: Add an empty-state branch**

The picker can now render zero services when the fetch fails. In the composable that renders the service list, wrap it:

```kotlin
    if (services.isEmpty()) {
        Text(
            text = stringResource(R.string.service_selection_catalogue_unavailable),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    } else {
        // existing list rendering
    }
```

Add to `technician-app/app/src/main/res/values/strings.xml`:

```xml
<string name="service_selection_catalogue_unavailable">Could not load the service list. Check your connection and pull to retry.</string>
```

And to `technician-app/app/src/main/res/values-hi/strings.xml`:

```xml
<string name="service_selection_catalogue_unavailable">सेवा सूची लोड नहीं हो सकी। कनेक्शन जांचें और रीफ्रेश करें।</string>
```

Use a hardcoded `Color` nowhere here — take colours from `MaterialTheme.colorScheme` so the empty state is legible in dark mode.

- [ ] **Step 7: Delete the hardcoded catalogue**

```bash
git rm technician-app/app/src/main/kotlin/com/homeservices/technician/ui/serviceprofile/ServiceCatalogue.kt
```

- [ ] **Step 8: Verify nothing still references it**

Run: `grep -rn "ServiceCatalogue" technician-app/app/src --include=*.kt`
Expected: no output. If anything remains, fix it before continuing.

- [ ] **Step 9: Build and run the full unit suite**

Run: `cd technician-app && ./gradlew assembleDebug testDebugUnitTest`
Expected: BUILD SUCCESSFUL, all tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A technician-app/app/src
git commit -m "feat(technician-app): render the live catalogue and delete the hardcoded list"
```

---

### Task 5: Paparazzi coverage for the new empty state

**Files:**
- Modify: the existing `ServiceSelectionScreen` Paparazzi test file under `technician-app/app/src/test/kotlin/.../ui/serviceprofile/`

- [ ] **Step 1: Add a snapshot case for the empty catalogue**

Add one test rendering `ServiceSelectionScreen` with `services = emptyList()` in both light and dark themes, following the existing cases in that file.

- [ ] **Step 2: Do NOT record goldens locally**

Do not run `recordPaparazziDebug`. Do not delete any existing golden.

- [ ] **Step 3: Record on CI**

Trigger the `paparazzi-record.yml` workflow via workflow_dispatch with `gradle_root=technician-app` and `gradle_task=recordPaparazziDebug` — both fields must be filled in explicitly, they silently default to customer-app when blank. Commit the produced artifact.

- [ ] **Step 4: Commit**

```bash
git add technician-app/app/src/test technician-app/app/src/test/snapshots
git commit -m "test(technician-app): Paparazzi case for the empty service catalogue"
```

---

### Task 6: Smoke gate, review, and release

- [ ] **Step 1: Run the full smoke gate**

Run: `bash tools/pre-codex-smoke.sh technician-app -PexcludePaparazzi`
Expected: exit 0 across all six steps. Run it bare, not piped to `tail`.

- [ ] **Step 2: Codex review**

Run: `codex review --base main`
If reviewing from a worktree, pass the `disk-full-read-access` sandbox permission. Fix findings in this session and re-run Codex at most once.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin <branch>
gh pr create --title "feat(technician-app): live service catalogue from /v1/categories" --body "<summary>"
```

- [ ] **Step 4: Bump versionCode and ship**

After merge, bump `technician-app` `versionCode` to 16 and `versionName` to 0.1.13, build the release bundle with `tools/build-play-bundles.ps1`, and upload to Play. Story A Task 5 (the prod seed run) is gated on this reaching production.
