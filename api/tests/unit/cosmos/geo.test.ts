import { describe, it, expect } from 'vitest';
import { boundingBoxPolygon, pointInsidePolygon } from '../../../src/cosmos/geo.js';

describe('boundingBoxPolygon', () => {
  const CENTER_LAT = 12.9352;  // Koramangala
  const CENTER_LNG = 77.6245;
  const RADIUS_KM = 5;

  it('returns a closed GeoJSON Polygon (first === last vertex)', () => {
    const poly = boundingBoxPolygon(CENTER_LAT, CENTER_LNG, RADIUS_KM);
    expect(poly.type).toBe('Polygon');
    const ring = poly.coordinates[0]!;
    expect(ring.length).toBe(5);
    expect(ring[0]).toEqual(ring[4]);
  });

  it('polygon spans approximately 2×radiusKm in each direction', () => {
    const poly = boundingBoxPolygon(CENTER_LAT, CENTER_LNG, RADIUS_KM);
    const ring = poly.coordinates[0]!;
    const lngs = ring.map(([lng]) => lng);
    const lats = ring.map(([, lat]) => lat!);
    const lngSpan = Math.max(...lngs) - Math.min(...lngs);
    const latSpan = Math.max(...lats) - Math.min(...lats);
    // 2 × (5 km / 111 km/deg) ≈ 0.09009 degrees lat
    expect(latSpan).toBeCloseTo(0.09009, 2);
    // lng span depends on cos(lat) — around Bengaluru cos(12.9°) ≈ 0.9744
    expect(lngSpan).toBeGreaterThan(0.09);
    expect(lngSpan).toBeLessThan(0.10);
  });
});

describe('pointInsidePolygon', () => {
  const CENTER_LAT = 12.9352;
  const CENTER_LNG = 77.6245;
  const RADIUS_KM = 5;
  const poly = boundingBoxPolygon(CENTER_LAT, CENTER_LNG, RADIUS_KM);

  it('returns true for center point', () => {
    expect(pointInsidePolygon(CENTER_LAT, CENTER_LNG, poly)).toBe(true);
  });

  it('returns false for a point clearly outside', () => {
    // Whitefield is ~14 km away — outside 5 km radius
    expect(pointInsidePolygon(12.9698, 77.7500, poly)).toBe(false);
  });

  it('correctness invariant: point at exact polygon boundary edge is excluded', () => {
    // Compute the exact north edge latitude
    const deltaLat = RADIUS_KM / 111;
    const edgeLat = CENTER_LAT + deltaLat;
    // A point sitting exactly on the north edge of the polygon
    expect(pointInsidePolygon(edgeLat, CENTER_LNG, poly)).toBe(false);
  });

  it('returns true for a point 1m inside the north boundary', () => {
    const deltaLat = RADIUS_KM / 111;
    const justInsideLat = CENTER_LAT + deltaLat - 0.00001; // ~1 m inside
    expect(pointInsidePolygon(justInsideLat, CENTER_LNG, poly)).toBe(true);
  });
});
