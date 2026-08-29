import type { CompassDirection, Spot, TideConstraint } from '../types/spot';
import { getWindForecast, type HourlyWind } from './weather';
import { getTideState } from './tide';

// Vrai moteur de matching : combine vent réel (weather.ts) et marée
// approximée (tide.ts) pour produire le verdict affiché dans l'app.
export interface SpotCondition {
  verdict: 'BONNES CONDITIONS' | 'CONDITIONS MOYENNES' | 'NON NAVIGABLE';
  color: string;
  windSpeed: number;
  windDir: CompassDirection;
  tideLabel: string;
  window: string;
}

const COLOR_BON = '#17A673';
const COLOR_MOYEN = '#F0A020';
const COLOR_MAUVAIS = '#E04B3C';

const COMPASS_ORDER: CompassDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// Open-Meteo renvoie une heure locale "naïve" (ex. "2026-08-29T14:00", sans
// fuseau) pour un point en France : on la traite comme heure murale
// Europe/Paris pour la comparer à l'ancre de marée (elle aussi ancrée en
// Europe/Paris). Règle UE : dernier dimanche de mars → dernier dimanche
// d'octobre = CEST (+02:00), sinon CET (+01:00).
function parisOffset(approxUtc: Date): string {
  const year = approxUtc.getUTCFullYear();
  const lastSundayAt1amUtc = (month: number) => {
    const d = new Date(Date.UTC(year, month + 1, 0, 1, 0, 0));
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d;
  };
  const dstStart = lastSundayAt1amUtc(2); // mars
  const dstEnd = lastSundayAt1amUtc(9); // octobre
  return approxUtc >= dstStart && approxUtc < dstEnd ? '+02:00' : '+01:00';
}

function parseParisLocal(naiveIso: string): Date {
  const offset = parisOffset(new Date(naiveIso + 'Z'));
  return new Date(`${naiveIso}:00${offset}`);
}

// Date locale (Europe/Paris) au format YYYY-MM-DD, sans le décalage UTC de
// Date.toISOString() qui peut faire glisser d'un jour près de minuit.
export function localDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function tideMatches(contrainte: TideConstraint, heightFraction: number): boolean {
  switch (contrainte) {
    case 'maree_haute':
      return heightFraction >= 0.75;
    case 'maree_basse':
      return heightFraction <= 0.25;
    case 'mi_maree_haute':
      return heightFraction >= 0.5;
    case 'mi_maree_basse':
      return heightFraction <= 0.5;
    default:
      // 'toutes', 'variable', 'inconnue' : pas de filtre automatisable
      return true;
  }
}

function directionMatches(favorables: CompassDirection[] | null, dir: CompassDirection): boolean {
  if (!favorables || favorables.length === 0) return true;
  if (favorables.includes(dir)) return true;
  const idx = COMPASS_ORDER.indexOf(dir);
  return favorables.some((f) => {
    const diff = Math.abs(COMPASS_ORDER.indexOf(f) - idx);
    return Math.min(diff, 8 - diff) === 1; // secteur voisin (45°) toléré
  });
}

function tideLabelFor(heightFraction: number, rising: boolean): string {
  if (heightFraction >= 0.85) return 'Pleine mer';
  if (heightFraction <= 0.15) return 'Basse mer';
  return rising ? 'Mi-marée montante' : 'Mi-marée descendante';
}

function hourLevel(hour: HourlyWind, spot: Spot): 'bon' | 'moyen' | 'mauvais' {
  const min = spot.ventMinNoeuds ?? 0;
  const max = spot.ventMaxNoeuds ?? Infinity;
  if (hour.windSpeedKn < min || hour.windSpeedKn > max) return 'mauvais';

  const dirOk = directionMatches(spot.directionsFavorables, hour.windDir);
  const tideOk = spot.mareeRef
    ? tideMatches(spot.contrainteMaree, getTideState(spot.mareeRef, parseParisLocal(hour.time)).heightFraction)
    : true;

  return dirOk && tideOk ? 'bon' : 'moyen';
}

function formatHour(naiveIso: string): string {
  return `${naiveIso.slice(11, 13)}h`;
}

export async function getSpotCondition(spot: Spot, dateIso: string): Promise<SpotCondition> {
  const forecast = await getWindForecast(spot);
  const dayHours = forecast.filter((h) => h.time.startsWith(dateIso));

  if (dayHours.length === 0) {
    return {
      verdict: 'NON NAVIGABLE',
      color: COLOR_MAUVAIS,
      windSpeed: 0,
      windDir: 'N',
      tideLabel: 'Hors prévision',
      window: 'Hors prévision',
    };
  }

  const withLevel = dayHours.map((hour) => ({ hour, level: hourLevel(hour, spot) }));
  const order: Record<'bon' | 'moyen' | 'mauvais', number> = { bon: 0, moyen: 1, mauvais: 2 };
  let bestLevel: 'bon' | 'moyen' | 'mauvais' = 'mauvais';
  for (const x of withLevel) {
    if (order[x.level] < order[bestLevel]) bestLevel = x.level;
  }

  const window = withLevel.filter((x) => x.level === bestLevel);
  const rep = window[Math.floor(window.length / 2)].hour;
  const tide = spot.mareeRef ? getTideState(spot.mareeRef, parseParisLocal(rep.time)) : null;

  const verdict =
    bestLevel === 'bon' ? 'BONNES CONDITIONS' : bestLevel === 'moyen' ? 'CONDITIONS MOYENNES' : 'NON NAVIGABLE';
  const color = bestLevel === 'bon' ? COLOR_BON : bestLevel === 'moyen' ? COLOR_MOYEN : COLOR_MAUVAIS;
  const windowLabel =
    bestLevel === 'mauvais'
      ? 'Vent hors plage'
      : `${formatHour(window[0].hour.time)} → ${formatHour(window[window.length - 1].hour.time)}`;

  return {
    verdict,
    color,
    windSpeed: rep.windSpeedKn,
    windDir: rep.windDir,
    tideLabel: tide ? tideLabelFor(tide.heightFraction, tide.rising) : 'Marée inconnue',
    window: windowLabel,
  };
}
