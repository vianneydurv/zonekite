import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import type { User } from 'firebase/auth';

import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import { subscribeToAuth } from './src/lib/auth';
import { getProfile } from './src/lib/profileStorage';
import { isRemotePhoto } from './src/lib/cloudinary';
import { syncDriverInfoOnMyTrips } from './src/lib/tripsStorage';
import type { Profile } from './src/types/profile';

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    return subscribeToAuth((u) => {
      setUser(u);
      if (!u) setProfile(undefined);
    });
  }, []);

  useEffect(() => {
    if (user) getProfile().then(setProfile);
  }, [user]);

  // Rattrapage : un conducteur dont la photo est déjà hébergée peut avoir
  // des trajets publiés avant (photo locale illisible par les autres).
  useEffect(() => {
    if (user && profile && isRemotePhoto(profile.photoUri)) {
      syncDriverInfoOnMyTrips(user.uid, profile.prenom, profile.photoUri).catch(() => {});
    }
  }, [user, profile]);

  // Laisse la photo de l'écran de chargement visible au moins 3 secondes,
  // même si l'auth/le profil se résolvent plus vite.
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setMinDelayElapsed(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  if (!fontsLoaded) return null;

  const stillLoading = user === undefined || (user && profile === undefined) || !minDelayElapsed;

  return (
    <SafeAreaProvider>
      <StatusBar style={profile ? 'dark' : 'light'} />
      {stillLoading ? (
        <LoadingScreen />
      ) : user === null ? (
        <AuthScreen />
      ) : profile === null ? (
        <OnboardingScreen onComplete={setProfile} />
      ) : profile && !isRemotePhoto(profile.photoUri) ? (
        // Profil créé avant l'hébergement des photos sur Cloudinary : sa
        // photo locale n'est visible par personne d'autre, on redemande
        // d'en choisir une (le reste du profil est pré-rempli).
        <OnboardingScreen initialProfile={profile} onComplete={setProfile} />
      ) : (
        <RootNavigator />
      )}
    </SafeAreaProvider>
  );
}
