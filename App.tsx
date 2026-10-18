import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
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
import BannedScreen from './src/screens/BannedScreen';
import TermsScreen from './src/screens/TermsScreen';
import { CGU_VERSION } from './src/lib/terms';
import { subscribeToAuth } from './src/lib/auth';
import { getProfile } from './src/lib/profileStorage';
import { isRemotePhoto } from './src/lib/cloudinary';
import { syncDriverInfoOnMyTrips } from './src/lib/tripsStorage';
import { registerForPushNotifications } from './src/lib/notifications';
import { syncMemberEntry } from './src/lib/members';
import { isBanned } from './src/lib/admin';
import type { Profile } from './src/types/profile';

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [banned, setBanned] = useState(false);
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
      if (!u) {
        setProfile(undefined);
        setBanned(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    getProfile().then(setProfile);
    isBanned(user.uid).then(setBanned);
  }, [user]);

  // Rattrapage : les comptes créés avant l'annuaire des membres y sont
  // ajoutés au lancement (compteur de membres du forum).
  useEffect(() => {
    if (user && profile) syncMemberEntry(user.uid, profile).catch(() => {});
  }, [user, profile]);

  // Enregistre ce téléphone pour les notifications (demande l'autorisation
  // au premier lancement), une fois le profil complet.
  useEffect(() => {
    if (user && profile && isRemotePhoto(profile.photoUri) && profile.genre) {
      registerForPushNotifications(user.uid).catch(() => {});
    }
  }, [user, profile]);

  // Rattrapage : un conducteur dont la photo est déjà hébergée peut avoir
  // des trajets publiés avant (photo locale illisible par les autres).
  useEffect(() => {
    if (user && profile && isRemotePhoto(profile.photoUri)) {
      syncDriverInfoOnMyTrips(user.uid, profile).catch(() => {});
    }
  }, [user, profile]);

  // Laisse la photo de l'écran de chargement visible au moins 3 secondes,
  // même si l'auth/le profil se résolvent plus vite.
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setMinDelayElapsed(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  const stillLoading = user === undefined || (user && profile === undefined) || !minDelayElapsed;

  // Fondu de sortie de l'écran de chargement : l'app s'affiche dessous et la
  // photo s'efface doucement par-dessus, au lieu d'une coupure nette.
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const [loadingVisible, setLoadingVisible] = useState(true);
  useEffect(() => {
    if (stillLoading || !fontsLoaded) return;
    Animated.timing(loadingOpacity, { toValue: 0, duration: 900, useNativeDriver: true }).start(() =>
      setLoadingVisible(false)
    );
  }, [stillLoading, fontsLoaded, loadingOpacity]);

  // Le formulaire de profil ne renvoie que ses propres champs : on garde le
  // reste (conditions acceptées, favoris, membres bloqués).
  const completeProfile = (p: Profile) => setProfile((prev) => ({ ...(prev ?? {}), ...p }));

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={profile && !loadingVisible ? 'dark' : 'light'} />
      {stillLoading ? null : user === null ? (
        <AuthScreen />
      ) : banned ? (
        <BannedScreen />
      ) : profile === null ? (
        <OnboardingScreen onComplete={completeProfile} />
      ) : profile && (!isRemotePhoto(profile.photoUri) || !profile.genre) ? (
        // Profil incomplet, créé avant l'ajout d'un champ désormais requis :
        // photo encore locale (invisible des autres, avant Cloudinary) ou
        // genre manquant. On redemande de compléter, le reste est pré-rempli.
        <OnboardingScreen initialProfile={profile} onComplete={completeProfile} />
      ) : profile && (profile.cguVersion ?? 0) < CGU_VERSION ? (
        // Conditions d'utilisation à accepter (nouveau membre, ou nouvelle
        // version) avant d'accéder au forum et au covoit.
        <TermsScreen onAccepted={() => setProfile({ ...profile, cguVersion: CGU_VERSION })} />
      ) : (
        <RootNavigator />
      )}
      {loadingVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: loadingOpacity }]} pointerEvents="none">
          <LoadingScreen />
        </Animated.View>
      )}
    </SafeAreaProvider>
  );
}
