import type { Spot, CompassDirection } from '../types/spot';

// Conditions de démonstration, en attendant l'intégration météo/marée réelle
// (Phase 3 de la roadmap : Open-Meteo + calcul de marée par constituants
// harmoniques). Déterministe par spot + jour, pour un affichage stable —
// ne reflète PAS de vraies prévisions.
export interface MockCondition {
  verdict: 'BONNES CONDITIONS' | 'CONDITIONS MOYENNES' | 'NON NAVIGABLE';
  color: string;
  windSpeed: number;
  windDir: CompassDirection;
  tideLabel: string;
  window: string;
}

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return () => {
    h = (Math.imul(48271, h) + 1) % 2147483647;
    return (h & 0x7fffffff) / 2147483647;
  };
}

export function getMockCondition(spot: Spot, dateIso: string): MockCondition {
  const rand = seededRandom(spot.id + dateIso);
  const roll = rand();

  const directions = spot.directionsFavorables ?? ['W'];
  const windDir = directions[Math.floor(rand() * directions.length)];

  const min = spot.ventMinNoeuds ?? 14;
  const max = spot.ventMaxNoeuds ?? 26;

  if (roll < 0.55) {
    return {
      verdict: 'BONNES CONDITIONS',
      color: '#17A673',
      windSpeed: Math.round(min + (max - min) * (0.4 + rand() * 0.4)),
      windDir,
      tideLabel: 'Mi-marée +',
      window: '11h → 17h',
    };
  }
  if (roll < 0.82) {
    return {
      verdict: 'CONDITIONS MOYENNES',
      color: '#F0A020',
      windSpeed: Math.round(min * 0.6 + rand() * 4),
      windDir,
      tideLabel: 'Basse mer',
      window: '13h → 16h',
    };
  }
  return {
    verdict: 'NON NAVIGABLE',
    color: '#E04B3C',
    windSpeed: Math.round(4 + rand() * 5),
    windDir,
    tideLabel: 'Défavorable',
    window: 'Vent insuffisant',
  };
}
