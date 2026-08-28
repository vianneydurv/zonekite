import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile } from '../types/profile';

// Stockage local en attendant Firebase (étape 9 de la roadmap) : le profil
// vit sur l'appareil pour l'instant, pas de compte multi-appareil possible.
const PROFILE_KEY = '@zonekite/profile';

export async function getProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
