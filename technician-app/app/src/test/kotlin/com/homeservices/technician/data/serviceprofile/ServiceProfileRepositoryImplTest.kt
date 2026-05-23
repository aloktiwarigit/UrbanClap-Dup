package com.homeservices.technician.data.serviceprofile

import com.homeservices.technician.data.network.defaultMoshi
import com.homeservices.technician.data.serviceprofile.remote.ServiceProfileApiService
import com.homeservices.technician.data.serviceprofile.remote.dto.ServiceLocationDto
import com.homeservices.technician.data.serviceprofile.remote.dto.ServiceProfileDto
import com.homeservices.technician.data.serviceprofile.remote.dto.UpdateServiceProfileRequestDto
import com.homeservices.technician.domain.serviceprofile.model.ServiceLocation
import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class ServiceProfileRepositoryImplTest {
    private val api: ServiceProfileApiService = mockk()
    private val repository = ServiceProfileRepositoryImpl(api)

    @Test
    public fun `getServiceProfile maps dto to domain`(): Unit =
        runTest {
            coEvery { api.getServiceProfile() } returns
                ServiceProfileDto(
                    skills = listOf("ac-deep-clean"),
                    location = ServiceLocationDto(lat = 26.7922, lng = 82.1998),
                )

            val result = repository.getServiceProfile()

            assertThat(result.getOrThrow())
                .isEqualTo(
                    ServiceProfile(
                        skills = listOf("ac-deep-clean"),
                        location = ServiceLocation(lat = 26.7922, lng = 82.1998),
                    ),
                )
        }

    @Test
    public fun `saveServiceProfile maps domain to patch body`(): Unit =
        runTest {
            val profile =
                ServiceProfile(
                    skills = listOf("ro-installation", "water-pump-repair"),
                    location = ServiceLocation(lat = 26.8, lng = 82.2),
                )
            coEvery { api.saveServiceProfile(any()) } returns
                ServiceProfileDto(
                    skills = profile.skills,
                    location = ServiceLocationDto(lat = 26.8, lng = 82.2),
                )

            val result = repository.saveServiceProfile(profile)

            assertThat(result.getOrThrow()).isEqualTo(profile)
            coVerify {
                api.saveServiceProfile(
                    UpdateServiceProfileRequestDto(
                        skills = listOf("ro-installation", "water-pump-repair"),
                        location = ServiceLocationDto(lat = 26.8, lng = 82.2),
                    ),
                )
            }
        }

    @Test
    public fun `service profile patch serializes stable json keys`(): Unit {
        val adapter = defaultMoshi.adapter(UpdateServiceProfileRequestDto::class.java)

        val json =
            adapter.toJson(
                UpdateServiceProfileRequestDto(
                    skills = listOf("water-pump-repair"),
                    location = ServiceLocationDto(lat = 40.512, lng = -74.412),
                ),
            )

        assertThat(json).contains("\"skills\"")
        assertThat(json).contains("\"location\"")
        assertThat(json).contains("\"lat\"")
        assertThat(json).contains("\"lng\"")
        assertThat(json).doesNotContain("\"a\"")
        assertThat(json).doesNotContain("\"b\"")
    }
}
