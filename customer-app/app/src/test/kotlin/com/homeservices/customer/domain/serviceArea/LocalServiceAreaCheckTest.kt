package com.homeservices.customer.domain.serviceArea

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance

/**
 * Unit tests for [LocalServiceAreaCheck] — ray-casting polygon check.
 *
 * Loads the polygon from `src/test/resources/service-area-ayodhya.geojson`
 * via [ClassLoader.getResourceAsStream] — no [android.content.Context] or
 * Robolectric required. Uses the internal secondary constructor that accepts
 * a pre-parsed ring.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class LocalServiceAreaCheckTest {

    private lateinit var checker: LocalServiceAreaCheck

    @BeforeAll
    public fun setUp() {
        val stream = javaClass.classLoader!!.getResourceAsStream("service-area-ayodhya.geojson")
            ?: error("service-area-ayodhya.geojson not found in test resources")
        val json = stream.bufferedReader().use { it.readText() }
        val ring = parseRing(json) // package-internal helper from LocalServiceAreaCheck.kt
        checker = LocalServiceAreaCheck(ring) // internal secondary constructor
    }

    /** Ramkot temple — exact centre of the 25 km service area. */
    @Test
    public fun pointAtRamkotTemple_returnsTrue() {
        assertThat(checker.isInside(lat = 26.7958, lng = 82.1947)).isTrue()
    }

    /** Faizabad city core — ~5 km from centre, well within the polygon. */
    @Test
    public fun pointInFaizabadCore_returnsTrue() {
        assertThat(checker.isInside(lat = 26.7740, lng = 82.1456)).isTrue()
    }

    /** Gonda district — north of polygon boundary (max lat ≈ 27.02°), outside. */
    @Test
    public fun pointInGonda_returnsFalse() {
        assertThat(checker.isInside(lat = 27.1336, lng = 81.9612)).isFalse()
    }

    /** Delhi — far outside the service area. */
    @Test
    public fun pointInDelhi_returnsFalse() {
        assertThat(checker.isInside(lat = 28.6139, lng = 77.2090)).isFalse()
    }

    /**
     * First vertex of the GeoJSON ring: [82.1947, 27.02063] → lng=82.1947, lat=27.02063.
     * Boundary-inclusive algorithm must return true.
     */
    @Test
    public fun pointOnPolygonEdge_returnsTrue() {
        assertThat(checker.isInside(lat = 27.02063, lng = 82.1947)).isTrue()
    }

    /** North Pole — far outside any plausible service area. */
    @Test
    public fun pointAtNorthPole_returnsFalse() {
        assertThat(checker.isInside(lat = 90.0, lng = 0.0)).isFalse()
    }
}
