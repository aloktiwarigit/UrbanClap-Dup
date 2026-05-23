/**
 * Tests for service-area.service.ts — E16-S01
 *
 * TDD: this file is committed BEFORE the implementation.
 *
 * Coordinate references:
 *   - Ramkot / Ram Janmabhoomi centre:    26.7958, 82.1947  (inside — the centre itself)
 *   - Ayodhya civil lines area:           26.7991, 82.2066  (inside — ~1.3 km from centre)
 *   - Faizabad city centre:               26.7742, 82.1498  (inside — ~6.5 km from Ramkot)
 *   - Delhi (Connaught Place):            28.6315, 77.2167  (outside — ~683 km)
 *   - Mumbai (Bandra Kurla):              19.0587, 72.8705  (outside — far)
 *   - Lucknow Hazratganj:                 26.8467, 80.9462  (outside — ~100 km)
 */

import { describe, it, expect } from 'vitest';
import { isLatLngInServiceArea } from '../../src/services/service-area.service.js';
import { AYODHYA_SERVICE_AREA } from '../../src/data/service-area-ayodhya.js';
import type { Feature, Polygon } from 'geojson';

// ---- helpers ---------------------------------------------------------------

function makePolygon(coords: [number, number][]): Feature<Polygon> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}

/**
 * A minimal square polygon covering roughly Ayodhya ± 0.05°
 * (used for edge tests where we need a deterministic boundary).
 * Vertices (lng, lat) per GeoJSON convention:
 *   SW=(82.14, 26.75)  SE=(82.25, 26.75)
 *   NE=(82.25, 26.85)  NW=(82.14, 26.85)
 */
const SQUARE: Feature<Polygon> = makePolygon([
  [82.14, 26.75],
  [82.25, 26.75],
  [82.25, 26.85],
  [82.14, 26.85],
  [82.14, 26.75], // closed
]);

// ---- unit tests against the real Ayodhya polygon --------------------------

describe('isLatLngInServiceArea — real Ayodhya polygon (25 km radius from Ramkot)', () => {
  it('polygon ring is closed (first coordinate === last coordinate)', () => {
    const coordinates = AYODHYA_SERVICE_AREA.geometry.coordinates;
    const ring = coordinates[0];
    // 32 unique vertices + 1 closing coordinate = 33 total
    expect(ring).toBeDefined();
    if (!ring) throw new Error('ring is undefined');
    expect(ring).toHaveLength(33);
    // Access via at() which returns T | undefined, then assert
    const first = ring.at(0);
    const last = ring.at(-1);
    expect(first).toBeDefined();
    expect(last).toBeDefined();
    expect(first).toEqual(last);
  });

  it('Ramkot centre (26.7958, 82.1947) is inside — AC-1', () => {
    expect(isLatLngInServiceArea(26.7958, 82.1947, AYODHYA_SERVICE_AREA)).toBe(true);
  });

  it('Ayodhya civil lines (26.7991, 82.2066) is inside', () => {
    expect(isLatLngInServiceArea(26.7991, 82.2066, AYODHYA_SERVICE_AREA)).toBe(true);
  });

  it('Faizabad city centre (26.7742, 82.1498) is inside — 25 km radius covers Faizabad', () => {
    expect(isLatLngInServiceArea(26.7742, 82.1498, AYODHYA_SERVICE_AREA)).toBe(true);
  });

  it('Delhi Connaught Place (28.6315, 77.2167) is outside — AC-2 / T-B1 recon candidate', () => {
    expect(isLatLngInServiceArea(28.6315, 77.2167, AYODHYA_SERVICE_AREA)).toBe(false);
  });

  it('Mumbai Bandra Kurla (19.0587, 72.8705) is outside', () => {
    expect(isLatLngInServiceArea(19.0587, 72.8705, AYODHYA_SERVICE_AREA)).toBe(false);
  });

  it('Lucknow Hazratganj (26.8467, 80.9462) is outside — ~100 km away', () => {
    expect(isLatLngInServiceArea(26.8467, 80.9462, AYODHYA_SERVICE_AREA)).toBe(false);
  });
});

// ---- unit tests against a deterministic square polygon --------------------

describe('isLatLngInServiceArea — square test polygon (deterministic boundary)', () => {
  it('centre of square (26.80, 82.195) is inside', () => {
    expect(isLatLngInServiceArea(26.80, 82.195, SQUARE)).toBe(true);
  });

  it('point well outside square (lat=27.0) is outside', () => {
    expect(isLatLngInServiceArea(27.0, 82.195, SQUARE)).toBe(false);
  });

  it('point on the polygon corner edge is treated as inside — AC-4 (Turf.js boundary inclusive)', () => {
    // SW corner vertex: lng=82.14, lat=26.75 → isLatLngInServiceArea(lat=26.75, lng=82.14, ...)
    expect(isLatLngInServiceArea(26.75, 82.14, SQUARE)).toBe(true);
  });

  it('function signature is (lat, lng, polygon) — not (lng, lat)', () => {
    // (26.80, 82.195) → lat inside 26.75..26.85, lng inside 82.14..82.25 → inside
    expect(isLatLngInServiceArea(26.80, 82.195, SQUARE)).toBe(true);
    // Swap: (82.195, 26.80) → lat=82.195 is outside the square's lat bounds → outside
    expect(isLatLngInServiceArea(82.195, 26.80, SQUARE)).toBe(false);
  });
});
