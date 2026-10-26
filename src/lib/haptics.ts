import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Retours haptiques de l'app. Les erreurs sont ignorées : un appareil sans
// moteur de vibration (ou le web) ne doit rien casser.
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

function run(fn: () => Promise<void>) {
  if (!enabled) return;
  fn().catch(() => {});
}

// Cran léger : défilement d'une roue (heures, km), d'une liste de spots,
// choix d'un jour.
export function hapticSelection() {
  run(() => Haptics.selectionAsync());
}

// Appui sur un bouton.
export function hapticTap() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

// Bouton principal (lancer la recherche, publier, demander une place).
export function hapticPress() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

// Action réussie (favori ajouté, envoi confirmé).
export function hapticSuccess() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// Arrivée des traits sur les spots pendant l'écran de chargement : quand
// plusieurs traits arrivent presque en même temps, un seul retour par
// intervalle pour garder des crans nets plutôt qu'un bourdonnement.
let lastArrival = 0;
export function hapticArrival(strength: 'soft' | 'light' = 'soft') {
  const now = Date.now();
  if (now - lastArrival < 45) return;
  lastArrival = now;
  run(() =>
    Haptics.impactAsync(strength === 'soft' ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Light)
  );
}
