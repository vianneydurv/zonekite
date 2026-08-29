// Approximation de marée par la composante harmonique principale M2 (cycle
// lunaire semi-diurne, dominant sur les côtes françaises). Ancrée sur une
// heure de pleine mer connue par spot (Spot.mareeRef) : donne un signal
// qualitatif (hauteur relative + sens), pas une hauteur en mètres précise.
// La dérive par rapport aux vraies marées (dues à S2, N2, etc.) reste faible
// sur l'horizon de prévision de l'app (7 jours), mais mareeRef doit être
// recalée de temps en temps sur une source officielle.
const M2_PERIOD_HOURS = 12.4206012;

export interface TideState {
  // 0 = basse mer, 1 = pleine mer
  heightFraction: number;
  // true = la mer monte (entre basse mer et pleine mer)
  rising: boolean;
}

export function getTideState(mareeRef: string, at: Date): TideState {
  const refMs = new Date(mareeRef).getTime();
  const hoursSinceRef = (at.getTime() - refMs) / 3_600_000;
  const phase = (((hoursSinceRef / M2_PERIOD_HOURS) % 1) + 1) % 1; // 0 = pleine mer
  const heightFraction = (1 + Math.cos(2 * Math.PI * phase)) / 2;
  const rising = phase >= 0.5;
  return { heightFraction, rising };
}
