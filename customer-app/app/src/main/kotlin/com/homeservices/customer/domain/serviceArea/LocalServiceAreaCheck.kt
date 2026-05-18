package com.homeservices.customer.domain.serviceArea

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Checks whether a lat/lng coordinate falls within the Ayodhya service area polygon.
 *
 * Production path: polygon loaded from `assets/service-area-ayodhya.geojson` via Hilt [Context].
 * Test path: construct via the internal secondary constructor that accepts a pre-parsed ring,
 *            bypassing the Android [AssetManager] entirely (no Robolectric needed).
 *
 * GeoJSON coordinate convention: coordinates are [longitude, latitude].
 * Ring pairs stored as (lng, lat) to match the GeoJSON array order.
 *
 * Algorithm: standard ray-casting, boundary-inclusive (exact vertex → true).
 * Parity: matches Turf.js `booleanPointInPolygon` behaviour.
 */
@Singleton
public class LocalServiceAreaCheck
    @Inject
    constructor(
        @ApplicationContext private val context: Context,
    ) {
        /** Internal secondary constructor — bypasses [AssetManager] for unit tests. */
        internal constructor(ring: List<Pair<Double, Double>>) : this(context = dummyContext()) {
            cachedRing = ring
        }

        @Volatile private var cachedRing: List<Pair<Double, Double>>? = null

        private val polygon: List<Pair<Double, Double>>
            get() = cachedRing ?: loadPolygon(context).also { cachedRing = it }

        /** Returns `true` if [lat]/[lng] is inside or on the boundary of the service area. */
        public fun isInside(
            lat: Double,
            lng: Double,
        ): Boolean = pointInPolygon(lat, lng, polygon)
    }

// ---------------------------------------------------------------------------
// Package-private helpers (accessible within the package and to tests
// in the same package via internal visibility in the same module).
// ---------------------------------------------------------------------------

internal fun loadPolygon(context: Context): List<Pair<Double, Double>> {
    val json =
        context.assets
            .open("service-area-ayodhya.geojson")
            .bufferedReader()
            .use { it.readText() }
    return parseRing(json)
}

internal fun parseRing(json: String): List<Pair<Double, Double>> {
    val coords =
        JSONObject(json)
            .getJSONObject("geometry")
            .getJSONArray("coordinates")
            .getJSONArray(0)
    return (0 until coords.length()).map { i ->
        val pt = coords.getJSONArray(i)
        Pair(pt.getDouble(0), pt.getDouble(1)) // (lng, lat) — GeoJSON order
    }
}

/**
 * Standard ray-casting point-in-polygon algorithm.
 *
 * Boundary-inclusive: a point exactly on a vertex returns `true`.
 *
 * @param lat  latitude of the query point
 * @param lng  longitude of the query point
 * @param ring list of (lng, lat) pairs; may be open or closed (last == first is ignored)
 */
internal fun pointInPolygon(
    lat: Double,
    lng: Double,
    ring: List<Pair<Double, Double>>,
): Boolean {
    var inside = false
    var j = ring.size - 1

    for (i in ring.indices) {
        val (iLng, iLat) = ring[i]
        val (jLng, jLat) = ring[j]

        // Exact vertex match → on boundary → inside
        if (iLat == lat && iLng == lng) return true

        // Ray crossing
        if ((iLat > lat) != (jLat > lat)) {
            val xIntercept = iLng + (lat - iLat) * (jLng - iLng) / (jLat - iLat)
            if (lng < xIntercept) inside = !inside
        }

        j = i
    }

    return inside
}

/**
 * Returns a no-op [Context] used only by the internal secondary constructor.
 * The context is never accessed when [cachedRing] is pre-set via that constructor.
 * Implemented as a late-binding stub that crashes loudly if any method is called,
 * making accidental production misuse visible immediately.
 */
private fun dummyContext(): Context =
    object : android.content.ContextWrapper(null) {
        override fun getAssets(): android.content.res.AssetManager =
            error("dummyContext must not be used in production — inject a real Context")
    }
