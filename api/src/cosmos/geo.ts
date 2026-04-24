export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface BoundingBoxPolygon {
  type: 'Polygon';
  coordinates: [[number, number][]];
}

export function boundingBoxPolygon(
  lat: number,
  lng: number,
  radiusKm: number,
): BoundingBoxPolygon {
  const deltaLat = radiusKm / 111;
  const deltaLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  const sw: [number, number] = [lng - deltaLng, lat - deltaLat];
  const se: [number, number] = [lng + deltaLng, lat - deltaLat];
  const ne: [number, number] = [lng + deltaLng, lat + deltaLat];
  const nw: [number, number] = [lng - deltaLng, lat + deltaLat];
  return {
    type: 'Polygon',
    coordinates: [[sw, se, ne, nw, sw]],
  };
}

/**
 * Ray-casting point-in-polygon test (unit tests only — not called at runtime).
 * Returns false for points on the boundary edge, mirroring Cosmos ST_WITHIN semantics.
 */
export function pointInsidePolygon(
  lat: number,
  lng: number,
  poly: BoundingBoxPolygon,
): boolean {
  const ring = poly.coordinates[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
