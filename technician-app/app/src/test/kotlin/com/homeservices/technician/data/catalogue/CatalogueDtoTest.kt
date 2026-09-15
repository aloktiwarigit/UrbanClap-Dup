package com.homeservices.technician.data.catalogue

import com.homeservices.technician.data.catalogue.remote.dto.CategoriesResponseDto
import com.squareup.moshi.Moshi
import org.junit.Assert.assertEquals
import org.junit.Test

public class CatalogueDtoTest {
    // Plain builder, no KotlinJsonAdapterFactory: the DTOs use
    // @JsonClass(generateAdapter = true), so KSP generates the adapters and Moshi
    // finds them by name. Adding the reflection factory here would pull in
    // moshi-kotlin and mask a missing @JsonClass annotation.
    private val moshi = Moshi.Builder().build()

    @Test
    public fun `flattens categories into selectable services tagged with their category name`() {
        val json =
            """
            {"categories":[
              {"id":"appliance-repair","name":"Appliance Repair","sortOrder":6,"services":[
                {"id":"appliance-fridge-repair","name":"Fridge Repair"}
              ]},
              {"id":"ac-repair","name":"AC Repair","sortOrder":1,"services":[
                {"id":"ac-deep-clean","name":"AC Deep Clean"},
                {"id":"ac-gas-refill","name":"AC Gas Refill"}
              ]}
            ]}
            """.trimIndent()

        val services = moshi.adapter(CategoriesResponseDto::class.java).fromJson(json)!!.toDomain()

        assertEquals(3, services.size)
        assertEquals("ac-deep-clean", services[0].id)
        assertEquals("AC Deep Clean", services[0].name)
        assertEquals("AC Repair", services[0].group)
        assertEquals("ac-gas-refill", services[1].id)
        assertEquals("AC Repair", services[1].group)
        assertEquals("appliance-fridge-repair", services[2].id)
        assertEquals("Appliance Repair", services[2].group)
    }

    @Test
    public fun `tolerates a category with no services array`() {
        val json = """{"categories":[{"id":"empty","name":"Empty","sortOrder":9}]}"""
        val services = moshi.adapter(CategoriesResponseDto::class.java).fromJson(json)!!.toDomain()
        assertEquals(0, services.size)
    }
}
