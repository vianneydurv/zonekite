export interface Coords {
  lat: number;
  lon: number;
}

// Géocodage gratuit via l'API Adresse (Base Adresse Nationale, data.gouv.fr),
// sans clé — suffisant puisque tous les spots sont en France.
export async function geocodeAddress(query: string): Promise<Coords | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(trimmed)}&limit=1`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const json = await response.json();
  const feature = json.features?.[0];
  if (!feature) return null;
  const [lon, lat] = feature.geometry.coordinates;
  return { lat, lon };
}

// Distance à vol d'oiseau (km), formule de Haversine.
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
