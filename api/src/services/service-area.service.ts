/**
 * Service-area polygon gating — E16-S01 / ADR-0020
 *
 * Pure function — no side effects, no I/O, no GrowthBook calls.
 * Callers (bookings.ts) are responsible for:
 *   1. Loading the polygon (static import of the GeoJSON file).
 *   2. Checking the feature flag before deciding to hard-reject or warn-only log.
 *   3. Logging the `service_area_check` structured event.
 *
 * Coordinate convention throughout this file: lat first, lng second — matching
 * the REST API `addressLatLng: { lat, lng }` convention. Turf.js internals use
 * [lng, lat] (GeoJSON order); the conversion happens inside isLatLngInServiceArea.
 */

import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, Polygon } from 'geojson';

/**
 * Returns `true` when the given (lat, lng) coordinate falls inside or on the
 * boundary of the supplied GeoJSON Polygon feature.
 *
 * @param lat     - Latitude (WGS-84). Valid range: -90..90.
 * @param lng     - Longitude (WGS-84). Valid range: -180..180.
 * @param polygon - A GeoJSON Feature<Polygon> with a closed exterior ring
 *                  (first coordinate === last coordinate).
 *
 * Turf.js `booleanPointInPolygon` uses the ray-casting algorithm and includes
 * boundary points (returns `true` for points exactly on an edge or vertex).
 * This satisfies AC-4 (boundary inclusive).
 */
export function isLatLngInServiceArea(lat: number, lng: number, polygon: Feature<Polygon>): boolean {
  // GeoJSON / Turf.js convention is [longitude, latitude]
  const pt = point([lng, lat]);
  return booleanPointInPolygon(pt, polygon);
}
