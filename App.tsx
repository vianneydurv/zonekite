import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import { getProfile } from './src/lib/profileStorage';
import type { Profile } from './src/types/profile';

export default function App() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

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
