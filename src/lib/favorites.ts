import AsyncStorage from '@react-native-async-storage/async-storage';

// Spots suivis (favoris), stockés localement en attendant Firebase.
const FAVORITES_KEY = '@zonekite/favorite-spots';

export async function getFavoriteIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleFavorite(spotId: string): Promise<string[]> {
  const ids = await getFavoriteIds();
  const next = ids.includes(spotId) ? ids.filter((id) => id !== spotId) : [...ids, spotId];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}
