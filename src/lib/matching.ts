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

// Seuils de hauteur (0 = basse mer, 1 = pleine mer) de la fenêtre
// favorable ; null = contrainte non automatisable ('toutes', 'variable',
// 'inconnue'), la marée ne pénalise alors jamais.
function tideWindow(contrainte: TideConstraint): { min: number; max: number } | null {
  switch (contrainte) {
    case 'maree_haute':
      return { min: 0.75, max: 1 };
    case 'maree_basse':
      return { min: 0, max: 0.25 };
    case 'mi_maree_haute':
      return { min: 0.5, max: 1 };
    case 'mi_maree_basse':
      return { min: 0, max: 0.5 };
    default:
      return null;
  }
}

// Marge (en fraction de marnage) autour de la fenêtre où la marée est
// jugée « limite » plutôt que franchement hors conditions.
const TIDE_MARGIN = 0.12;

function tideLevel(contrainte: TideConstraint, heightFraction: number): Level {
  const w = tideWindow(contrainte);
  if (!w) return 'bon';
  if (heightFraction >= w.min && heightFraction <= w.max) return 'bon';
  const distance = heightFraction < w.min ? w.min - heightFraction : heightFraction - w.max;
  return distance <= TIDE_MARGIN ? 'moyen' : 'mauvais';
}

// Fenêtre favorable sur l'axe basse mer (0) → pleine mer (100), alignée sur
// les seuils de tideMatches ci-dessus — pour l'affichage de la barre marée.
// null = pas de fenêtre précise à mettre en avant (navigable à toute marée,
// contrainte variable ou non documentée).
export function tideIdealZone(contrainte: TideConstraint): { left: number; width: number } | null {
  switch (contrainte) {
    case 'maree_haute':
      return { left: 75, width: 25 };
    case 'maree_basse':
      return { left: 0, width: 25 };
    case 'mi_maree_haute':
      return { left: 50, width: 50 };
    case 'mi_maree_basse':
      return { left: 0, width: 50 };
    default:
      return null;
  }
}

// Direction favorable = vert ; secteur voisin (45°) = limite ; au-delà =
// non navigable (souvent offshore ou side-off dangereux). Spot sans
// directions documentées : on ne pénalise pas.
function directionLevel(favorables: CompassDirection[] | null, dir: CompassDirection): Level {
  if (!favorables || favorables.length === 0) return 'bon';
  if (favorables.includes(dir)) return 'bon';
  const idx = COMPASS_ORDER.indexOf(dir);
  const isNeighbor = favorables.some((f) => {
    const diff = Math.abs(COMPASS_ORDER.indexOf(f) - idx);
    return Math.min(diff, 8 - diff) === 1;
  });
  return isNeighbor ? 'moyen' : 'mauvais';
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

export type Level = 'bon' | 'moyen' | 'mauvais';

const LEVEL_ORDER: Record<Level, number> = { bon: 0, moyen: 1, mauvais: 2 };

function worst(...levels: Level[]): Level {
  return levels.reduce((a, b) => (LEVEL_ORDER[b] > LEVEL_ORDER[a] ? b : a), 'bon');
}

// Vent un peu faible (jusqu'à 3 nds sous le mini) ou un peu fort (jusqu'à
// 5 nds au-dessus du maxi) = limite : naviguable avec la bonne aile.
const WIND_MARGIN_LOW_KN = 3;
const WIND_MARGIN_HIGH_KN = 5;

function windLevel(speedKn: number, spot: Spot): Level {
  const min = spot.ventMinNoeuds ?? DEFAULT_WIND_MIN_KN;
  const max = spot.ventMaxNoeuds ?? DEFAULT_WIND_MAX_KN;
  if (speedKn >= min && speedKn <= max) return 'bon';
  if (speedKn >= min - WIND_MARGIN_LOW_KN && speedKn <= max + WIND_MARGIN_HIGH_KN) return 'moyen';
  return 'mauvais';
}

interface HourEvaluation {
  level: Level;
  windLevel: Level;
  dirLevel: Level;
  tideLevel: Level;
}

// Verdict d'une heure = le pire des trois critères.
function evaluateHour(hour: HourlyWind, spot: Spot): HourEvaluation {
  const wind = windLevel(hour.windSpeedKn, spot);
  const dir = directionLevel(spot.directionsFavorables, hour.windDir);
  const tide = spot.mareeRef
    ? tideLevel(spot.contrainteMaree, getTideState(spot.mareeRef, parseParisLocal(hour.time)).heightFraction)
    : 'bon';
  return { level: worst(wind, dir, tide), windLevel: wind, dirLevel: dir, tideLevel: tide };
}

function hourLevel(hour: HourlyWind, spot: Spot): Level {
  return evaluateHour(hour, spot).level;
}

function formatHour(naiveIso: string): string {
  return `${naiveIso.slice(11, 13)}h`;
}

export interface HourCondition {
  hour: number; // 0-23
  hourLabel: string;
  windSpeedKn: number;
  windGustKn: number;
  windDir: CompassDirection;
  windDirDeg: number;
  tideLabel: string;
  // 0 = basse mer, 1 = pleine mer ; null si le spot n'a pas de mareeRef.
  tideHeightFraction: number | null;
  tideRising: boolean | null;
  level: Level;
  // Niveau par critère — pour colorer chaque ligne du tableau de prévisions.
  windLevel: Level;
  dirLevel: Level;
  tideLevel: Level;
}

export async function getHourlyConditions(spot: Spot, dateIso: string): Promise<HourCondition[]> {
  const forecast = await getWindForecast(spot);
  return forecast
    .filter((h) => h.time.startsWith(dateIso))
    .map((hour) => {
      const tide = spot.mareeRef ? getTideState(spot.mareeRef, parseParisLocal(hour.time)) : null;
      const evaluation = evaluateHour(hour, spot);
      return {
        hour: Number(hour.time.slice(11, 13)),
        hourLabel: formatHour(hour.time),
        windSpeedKn: hour.windSpeedKn,
        windGustKn: hour.windGustKn,
        windDir: hour.windDir,
        windDirDeg: hour.windDirDeg,
        tideLabel: tide ? tideLabelFor(tide.heightFraction, tide.rising) : 'Marée inconnue',
        tideHeightFraction: tide ? tide.heightFraction : null,
        tideRising: tide ? tide.rising : null,
        ...evaluation,
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
  let bestLevel: Level = 'mauvais';
  for (const x of withLevel) {
    if (LEVEL_ORDER[x.level] < LEVEL_ORDER[bestLevel]) bestLevel = x.level;
  }

  const window = withLevel.filter((x) => x.level === bestLevel);

  const verdict =
    bestLevel === 'bon' ? 'MEILLEURES CONDITIONS ENTRE' : bestLevel === 'moyen' ? 'CONDITIONS MOYENNES' : 'NON NAVIGABLE';
  const color = bestLevel === 'bon' ? COLOR_BON : bestLevel === 'moyen' ? COLOR_MOYEN : COLOR_MAUVAIS;
  const windowLabel =
    bestLevel === 'mauvais'
      ? 'Hors conditions'
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
