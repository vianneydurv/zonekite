import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, typography } from '../theme';
import { getProfile } from '../lib/profileStorage';
import { authErrorMessage, deleteCurrentUser, reauthenticate, signOut } from '../lib/auth';
import { deleteMyData } from '../lib/accountDeletion';
import { auth } from '../lib/firebase';
import { getTrips } from '../lib/tripsStorage';
import { getMyRequests } from '../lib/rideRequests';
import { localDateIso } from '../lib/matching';
import { getFavoriteIds } from '../lib/favorites';
import { spots } from '../data/spots';
import { NIVEAU_LABELS, type Profile } from '../types/profile';
import type { Trajet } from '../types/trajet';
import type { RideRequest, RideRequestStatus } from '../types/rideRequest';
import OnboardingScreen from './OnboardingScreen';

const NEXT_RIDE_STATUS_LABELS: Record<RideRequestStatus, string> = {
  pending: 'EN ATTENTE',
  accepted: 'CONFIRMÉ',
  refused: 'REFUSÉ',
};

interface NextRide {
  trip: Trajet;
  spotName: string;
  status: RideRequestStatus;
}

// Profil utilisateur : prénom, photo, niveau, ville, matériel
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [carpoolCount, setCarpoolCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [nextRide, setNextRide] = useState<NextRide | null>(null);
  const [pastTrips, setPastTrips] = useState<Trajet[]>([]);
  const [myRequests, setMyRequests] = useState<RideRequest[]>([]);
  const [editing, setEditing] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile);
      getFavoriteIds().then((ids) => setFavoriteCount(ids.length));

      Promise.all([getTrips(), getMyRequests(), getProfile()]).then(([allTrips, requests, p]) => {
        setMyRequests(requests);
        const todayIso = localDateIso(new Date());
        const trips = allTrips.filter((t) => t.date >= todayIso);
        const requestedIds = requests.map((r) => r.tripId);
        const mine = trips.filter((t) => t.conducteurPrenom === p?.prenom || requestedIds.includes(t.id));
        setCarpoolCount(mine.length);

        const upcoming = trips
          .filter((t) => requestedIds.includes(t.id))
          .sort((a, b) => a.date.localeCompare(b.date))[0];
        const upcomingRequest = upcoming ? requests.find((r) => r.tripId === upcoming.id) : null;
        if (upcoming && upcomingRequest) {
          const spot = spots.find((s) => s.id === upcoming.spotId);
          setNextRide({ trip: upcoming, spotName: spot?.nom ?? 'Spot inconnu', status: upcomingRequest.status });
        } else {
          setNextRide(null);
        }

        const past = allTrips
          .filter((t) => t.date < todayIso && (t.conducteurPrenom === p?.prenom || requestedIds.includes(t.id)))
          .sort((a, b) => b.date.localeCompare(a.date));
        setPastTrips(past);
      });
    }, [])
  );

  async function handleDeleteAccount() {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      // Reauthentification requise par Firebase pour une suppression de
      // compte. On nettoie les données Firestore tant qu'on est encore
      // authentifié (les règles vérifient l'uid) puis on supprime le
      // compte Auth en dernier — une fois parti, on ne peut plus prouver
      // qui on est pour finir le nettoyage.
      await reauthenticate(deletePassword);
      await deleteMyData();
      await deleteCurrentUser();
    } catch (error) {
      const code = error instanceof Object && 'code' in error ? String(error.code) : '';
      Alert.alert('Suppression impossible', authErrorMessage(code));
      setDeleting(false);
    }
  }

  if (!profile) return null;

  if (editing) {
    return (
      <OnboardingScreen
        initialProfile={profile}
        onCancel={() => setEditing(false)}
        onComplete={(p) => {
          setProfile(p);
          setEditing(false);
        }}
      />
    );
  }

  const ailes = profile.materiel?.ailes ?? [];
  const boards = profile.materiel?.boards ?? [];
  const autres = profile.materiel?.autres ?? [];
  const materielChips = [
    ...ailes.map((a) => [a.marque, a.modele, a.taille].filter(Boolean).join(' ') || 'Aile'),
    ...boards.map((b) => [b.marque, b.modele].filter(Boolean).join(' ') || 'Board'),
    ...autres.map((a) => a.nom),
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.settingsLink}
          onPress={() =>
            Alert.alert('Réglages', undefined, [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Se déconnecter', style: 'destructive', onPress: () => signOut() },
              {
                text: 'Supprimer mon compte',
                style: 'destructive',
                onPress: () => setShowDeleteAccount(true),
              },
            ])
          }
        >
          <Text style={styles.settingsLinkText}>RÉGLAGES</Text>
        </Pressable>

        <Pressable style={styles.profileRow} onPress={() => setEditing(true)}>
          <Image source={{ uri: profile.photoUri }} style={styles.photo} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.prenom}>{profile.prenom}</Text>
            <Text style={styles.subline}>
              {NIVEAU_LABELS[profile.niveau]}
              {profile.ville ? ` · ${profile.ville}` : ''}
            </Text>
            {auth.currentUser?.email && (
              <Text style={styles.emailLine}>{auth.currentUser.email}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.white(0.5)} />
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{carpoolCount}</Text>
            <Text style={styles.statLabel}>COVOITS</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{favoriteCount}</Text>
            <Text style={styles.statLabel}>SPOTS SUIVIS</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardEyebrow}>MON MATÉRIEL</Text>
            <Pressable onPress={() => setEditing(true)}>
              <Text style={styles.cardLink}>Modifier</Text>
            </Pressable>
          </View>
          {materielChips.length === 0 ? (
            <Text style={styles.emptyText}>Aucun matériel renseigné</Text>
          ) : (
            <View style={styles.chipRow}>
              {materielChips.map((label, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>PROCHAIN TRAJET</Text>
          <View style={styles.nextRideRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextRideTitle}>
                {nextRide ? `Passager chez ${nextRide.trip.conducteurPrenom}` : 'Aucun trajet réservé'}
              </Text>
              <Text style={styles.nextRideSub}>
                {nextRide
                  ? `${nextRide.spotName} · ${nextRide.trip.heureDepart} · ${nextRide.trip.adresseDepart}`
                  : "Réserve une place depuis l'onglet Covoit"}
              </Text>
            </View>
            {nextRide && (
              <View style={nextRide.status === 'accepted' ? styles.statusBadgeGood : styles.statusBadge}>
                <Text style={nextRide.status === 'accepted' ? styles.statusBadgeGoodText : styles.statusBadgeText}>
                  {NEXT_RIDE_STATUS_LABELS[nextRide.status]}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>HISTORIQUE</Text>
          {pastTrips.length === 0 ? (
            <Text style={styles.emptyText}>Aucun trajet passé pour l'instant.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {pastTrips.map((trip) => {
                const spot = spots.find((s) => s.id === trip.spotId);
                const isDriver = trip.conducteurPrenom === profile.prenom;
                const request = !isDriver ? myRequests.find((r) => r.tripId === trip.id) : null;
                return (
                  <Pressable
                    key={trip.id}
                    style={styles.historyRow}
                    onPress={() => navigation.navigate('Carpool', { screen: 'TripDetail', params: { tripId: trip.id } })}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.historyTitle} numberOfLines={1}>
                        {spot?.nom ?? 'Spot inconnu'}
                      </Text>
                      <Text style={styles.historySub}>
                        {new Date(trip.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {' · '}
                        {isDriver ? 'Conducteur·rice' : `Passager chez ${trip.conducteurPrenom}`}
                      </Text>
                    </View>
                    {request && (
                      <View style={request.status === 'accepted' ? styles.statusBadgeGood : styles.statusBadge}>
                        <Text style={request.status === 'accepted' ? styles.statusBadgeGoodText : styles.statusBadgeText}>
                          {NEXT_RIDE_STATUS_LABELS[request.status]}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showDeleteAccount} transparent animationType="fade">
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Supprimer ton compte ?</Text>
            <Text style={styles.sheetBody}>
              Action définitive et irréversible. Confirme avec ton mot de passe pour continuer.
            </Text>
            <TextInput
              style={styles.sheetInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Mot de passe"
              placeholderTextColor={colors.navy(0.45)}
              secureTextEntry
              autoCapitalize="none"
              editable={!deleting}
            />
            <View style={styles.sheetActionsRow}>
              <Pressable
                style={styles.sheetCancelButton}
                onPress={() => {
                  setShowDeleteAccount(false);
                  setDeletePassword('');
                }}
                disabled={deleting}
              >
                <Text style={styles.sheetCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.sheetDeleteButton, (!deletePassword || deleting) && styles.sheetDeleteButtonDisabled]}
                onPress={handleDeleteAccount}
                disabled={!deletePassword || deleting}
              >
                <Text style={styles.sheetDeleteText}>{deleting ? 'Suppression...' : 'Supprimer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.background },
  header: { backgroundColor: colors.navyBase, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 },
  settingsLink: { alignSelf: 'flex-end' },
  settingsLinkText: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.white(0.65), letterSpacing: 0.4 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 8 },
  photo: { width: 72, height: 72, borderRadius: 36 },
  prenom: { fontFamily: typography.h1.fontFamily, fontSize: 23, color: colors.neutral.white, letterSpacing: -0.4 },
  subline: { ...typography.body, color: colors.white(0.6), marginTop: 5 },
  emailLine: { ...typography.body, fontSize: 11.5, color: colors.white(0.4), marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  statTile: { flex: 1, backgroundColor: colors.white(0.1), borderRadius: 11, padding: 11 },
  statValue: { fontFamily: typography.h1.fontFamily, fontSize: 19, color: colors.neutral.white },
  statLabel: { fontFamily: typography.h3.fontFamily, fontSize: 9, color: colors.white(0.55), letterSpacing: 0.8, marginTop: 2 },
  body: { flex: 1 },
  bodyContent: { padding: 14, paddingTop: 14, gap: 10 },
  card: { backgroundColor: colors.neutral.white, borderRadius: 14, padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  cardEyebrow: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.navy(0.55), letterSpacing: 1 },
  cardLink: { fontFamily: typography.h3.fontFamily, fontSize: 11.5, color: colors.blue },
  emptyText: { ...typography.body, color: colors.neutral.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 9, backgroundColor: '#F0F4F7' },
  chipText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.navyBase },
  nextRideRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.navyBase },
  historySub: { ...typography.body, color: colors.navy(0.5), marginTop: 2 },
  nextRideTitle: { fontFamily: typography.h3.fontFamily, fontSize: 14.5, color: colors.navyBase },
  nextRideSub: { ...typography.body, color: colors.navy(0.5), marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FDF3E3' },
  statusBadgeText: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: '#9A6200' },
  statusBadgeGood: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EAF7F1' },
  statusBadgeGoodText: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.status.good },
  sheetBackdrop: { flex: 1, backgroundColor: colors.navy(0.45), justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.neutral.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 26, paddingBottom: 34 },
  sheetTitle: { fontFamily: typography.h1.fontFamily, fontSize: 20, color: colors.navyBase },
  sheetBody: { ...typography.body, color: colors.navy(0.65), marginTop: 8, lineHeight: 19 },
  sheetInput: {
    backgroundColor: '#F0F4F7',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    ...typography.body,
    color: colors.navyBase,
  },
  sheetActionsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  sheetCancelButton: { flex: 1, backgroundColor: '#F0F4F7', borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  sheetCancelText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.navy(0.6) },
  sheetDeleteButton: { flex: 1, backgroundColor: '#C0392B', borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  sheetDeleteButtonDisabled: { opacity: 0.5 },
  sheetDeleteText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.neutral.white },
});
