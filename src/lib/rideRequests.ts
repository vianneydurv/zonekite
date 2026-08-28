import AsyncStorage from '@react-native-async-storage/async-storage';

// Suivi local de "j'ai demandé une place sur ce trajet". Tant que Firebase
// n'est pas branché (étape 9+), ça ne notifie pas réellement le conducteur —
// ça mémorise juste ta demande sur cet appareil.
const REQUESTS_KEY = '@zonekite/ride-requests';

export async function getRequestedTripIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(REQUESTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function requestSeat(tripId: string): Promise<void> {
  const ids = await getRequestedTripIds();
  if (!ids.includes(tripId)) {
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify([...ids, tripId]));
  }
}
