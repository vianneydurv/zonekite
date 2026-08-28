import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trajet } from '../types/trajet';
import { demoTrips } from '../data/demoTrips';

// Stockage local en attendant Firebase (étape 9+) : les trajets créés ici ne
// sont visibles que sur cet appareil, pas partagés avec les autres membres.
const TRIPS_KEY = '@zonekite/trips';

export async function getTrips(): Promise<Trajet[]> {
  const raw = await AsyncStorage.getItem(TRIPS_KEY);
  if (!raw) {
    await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(demoTrips));
    return demoTrips;
  }
  return JSON.parse(raw);
}

export async function addTrip(trip: Trajet): Promise<void> {
  const trips = await getTrips();
  await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify([trip, ...trips]));
}
