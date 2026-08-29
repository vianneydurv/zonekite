import type { CompassDirection, Spot } from '../types/spot';

// Prévisions vent réelles via Open-Meteo (gratuit, sans clé). Fonction 3 de la
// roadmap : fournit la donnée brute, pas encore le verdict (voir Fonction 5,
// qui combinera ceci avec la marée dans mockConditions.ts).
export interface HourlyWind {
  time: string; // ISO local (fuseau du spot), ex. "2026-08-29T14:00"
  windSpeedKn: number;
  windGustKn: number;
  windDirDeg: number;
  windDir: CompassDirection;
}

const FORECAST_DAYS = 7;
const CACHE_TTL_MS = 30 * 60 * 1000;

const cache = new Map<string, { fetchedAt: number; data: HourlyWind[] }>();

const COMPASS_DIRECTIONS: CompassDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function degToCompass(deg: number): CompassDirection {
  const index = Math.round(deg / 45) % 8;
  return COMPASS_DIRECTIONS[index];
}

export async function getWindForecast(spot: Pick<Spot, 'id' | 'lat' | 'lon'>): Promise<HourlyWind[]> {
  const cached = cache.get(spot.id);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}` +
    `&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
    `&wind_speed_unit=kn&forecast_days=${FORECAST_DAYS}&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo a répondu ${response.status}`);
  }
  const json = await response.json();
  const { time, wind_speed_10m, wind_direction_10m, wind_gusts_10m } = json.hourly;

  const data: HourlyWind[] = time.map((t: string, i: number) => ({
    time: t,
    windSpeedKn: Math.round(wind_speed_10m[i]),
    windGustKn: Math.round(wind_gusts_10m[i]),
    windDirDeg: wind_direction_10m[i],
    windDir: degToCompass(wind_direction_10m[i]),
  }));

  cache.set(spot.id, { fetchedAt: Date.now(), data });
  return data;
}
