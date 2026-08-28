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

import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import { getProfile } from './src/lib/profileStorage';
import type { Profile } from './src/types/profile';

export default function App() {
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
    getProfile().then(setProfile);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={profile ? 'dark' : 'light'} />
      {profile === undefined ? (
        <LoadingScreen />
      ) : profile === null ? (
        <OnboardingScreen onComplete={setProfile} />
      ) : (
        <RootNavigator />
      )}
    </SafeAreaProvider>
  );
}
