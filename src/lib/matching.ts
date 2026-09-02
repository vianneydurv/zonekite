import type { CompassDirection, Spot, TideConstraint } from '../types/spot';
import { getWindForecast, type HourlyWind } from './weather';
import { getTideState } from './tide';

// Vrai moteur de matching : combine vent réel (weather.ts) et marée
// approximée (tide.ts) pour produire le verdict affiché dans l'app.
export interface SpotCondition {
  verdict: 'MEILLEURES CONDITIONS ENTRE' | 'CONDITIONS MOYENNES' | 'NON NAVIGABLE';
  color: string;
  windSpeed: number;
  windDir: CompassDirection;
  tideLabel: string;
  window: string;
  // Heure à laquelle windSpeed/windDir/tideLabel ont été relevés — le début
  // du créneau recherché (« instant T » de la recherche), pas le milieu du
  // meilleur sous-créneau (qui, lui, reste affiché dans `window`).
  readingHour: string;
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

const COMPASS_DEGREES: Record<CompassDirection, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

// Position (0-100) sur une barre horizontale Ouest→Est : projection du
// vent sur l'axe est-ouest (Ouest à gauche, Nord/Sud au centre, Est à
// droite), plus parlant qu'un repère fixe pour une direction de vent.
export function directionToBarPercent(dir: CompassDirection): number {
  const rad = (COMPASS_DEGREES[dir] * Math.PI) / 180;
  return ((Math.sin(rad) + 1) / 2) * 100;
}

function tideLabelFor(heightFraction: number, rising: boolean): string {
  if (heightFraction >= 0.85) return 'Pleine mer';
  if (heightFraction <= 0.15) return 'Basse mer';
  return rising ? 'Mi-marée montante' : 'Mi-marée descendante';
}

// Plage de vent par défaut quand le spot n'a pas encore ses seuils propres
// renseignés (cas de la majorité des spots "à compléter") — sans ça, un
// vent de 3 nds passait pour "bon" faute de plafond/plancher à comparer.
export const DEFAULT_WIND_MIN_KN = 12;
export const DEFAULT_WIND_MAX_KN = 30;

interface HourEvaluation {
  level: 'bon' | 'moyen' | 'mauvais';
  windOk: boolean;
  dirOk: boolean;
  tideOk: boolean;
}

function evaluateHour(hour: HourlyWind, spot: Spot): HourEvaluation {
  const min = spot.ventMinNoeuds ?? DEFAULT_WIND_MIN_KN;
  const max = spot.ventMaxNoeuds ?? DEFAULT_WIND_MAX_KN;
  const windOk = hour.windSpeedKn >= min && hour.windSpeedKn <= max;
  const dirOk = directionMatches(spot.directionsFavorables, hour.windDir);
  const tideOk = spot.mareeRef
    ? tideMatches(spot.contrainteMaree, getTideState(spot.mareeRef, parseParisLocal(hour.time)).heightFraction)
    : true;

  const level: 'bon' | 'moyen' | 'mauvais' = !windOk ? 'mauvais' : dirOk && tideOk ? 'bon' : 'moyen';
  return { level, windOk, dirOk, tideOk };
}

function hourLevel(hour: HourlyWind, spot: Spot): 'bon' | 'moyen' | 'mauvais' {
  return evaluateHour(hour, spot).level;
}

function formatHour(naiveIso: string): string {
  return `${naiveIso.slice(11, 13)}h`;
}

export interface HourCondition {
  hourLabel: string;
  windSpeedKn: number;
  windGustKn: number;
  windDir: CompassDirection;
  tideLabel: string;
  level: 'bon' | 'moyen' | 'mauvais';
  // Détail par critère — pour signaler ce qui bloque la navigabilité dans
  // l'UI (ex. vent OK mais marée hors fenêtre => marée en rouge).
  windOk: boolean;
  dirOk: boolean;
  tideOk: boolean;
}

export async function getHourlyConditions(spot: Spot, dateIso: string): Promise<HourCondition[]> {
  const forecast = await getWindForecast(spot);
  return forecast
    .filter((h) => h.time.startsWith(dateIso))
    .map((hour) => {
      const tide = spot.mareeRef ? getTideState(spot.mareeRef, parseParisLocal(hour.time)) : null;
      const evaluation = evaluateHour(hour, spot);
      return {
        hourLabel: formatHour(hour.time),
        windSpeedKn: hour.windSpeedKn,
        windGustKn: hour.windGustKn,
        windDir: hour.windDir,
        tideLabel: tide ? tideLabelFor(tide.heightFraction, tide.rising) : 'Marée inconnue',
        level: evaluation.level,
        windOk: evaluation.windOk,
        dirOk: evaluation.dirOk,
        tideOk: evaluation.tideOk,
      };
    });
}

export interface HourRange {
  start: number;
  end: number;
}

export async function getSpotCondition(
  spot: Spot,
  dateIso: string,
  hourRange?: HourRange
): Promise<SpotCondition> {
  const forecast = await getWindForecast(spot);
  let dayHours = forecast.filter((h) => h.time.startsWith(dateIso));
  if (hourRange) {
    dayHours = dayHours.filter((h) => {
      const hh = Number(h.time.slice(11, 13));
      return hh >= hourRange.start && hh <= hourRange.end;
    });
  }

  if (dayHours.length === 0) {
    return {
      verdict: 'NON NAVIGABLE',
      color: COLOR_MAUVAIS,
      windSpeed: 0,
      windDir: 'N',
      tideLabel: 'Hors prévision',
      window: 'Hors prévision',
      readingHour: '—',
    };
  }

  // Relevé vent/marée affiché en gros : à l'instant T de la recherche, soit
  // le début du créneau demandé (première heure de prévision disponible
  // dans la plage recherchée) — pas le milieu du meilleur sous-créneau.
  const rep = dayHours[0];
  const tide = spot.mareeRef ? getTideState(spot.mareeRef, parseParisLocal(rep.time)) : null;

  const withLevel = dayHours.map((hour) => ({ hour, level: hourLevel(hour, spot) }));
  const order: Record<'bon' | 'moyen' | 'mauvais', number> = { bon: 0, moyen: 1, mauvais: 2 };
  let bestLevel: 'bon' | 'moyen' | 'mauvais' = 'mauvais';
  for (const x of withLevel) {
    if (order[x.level] < order[bestLevel]) bestLevel = x.level;
  }

  const window = withLevel.filter((x) => x.level === bestLevel);

  const verdict =
    bestLevel === 'bon' ? 'MEILLEURES CONDITIONS ENTRE' : bestLevel === 'moyen' ? 'CONDITIONS MOYENNES' : 'NON NAVIGABLE';
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
    readingHour: formatHour(rep.time),
  };
}
