/**
 * Geodesic distance between WGS84 points (for map filters + measure tool).
 */

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Sum segment lengths along a path */
export function pathLengthKm(points: { lat: number; lng: number }[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) {
    sum += haversineKm(points[i - 1]!, points[i]!);
  }
  return sum;
}
