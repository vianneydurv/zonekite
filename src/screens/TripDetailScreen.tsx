import { useCallback, useState } from 'react';
import { Alert, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarpoolStackParamList } from '../navigation/CarpoolStackNavigator';
import { spots } from '../data/spots';
import { colors, typography } from '../theme';
import { deleteTrip, getTrips } from '../lib/tripsStorage';
import { acceptRequest, getMyRequests, getRequestsForTrips, refuseRequest, requestSeat } from '../lib/rideRequests';
import { getProfile } from '../lib/profileStorage';
import type { Trajet } from '../types/trajet';
import type { Profile } from '../types/profile';
import type { RideRequest } from '../types/rideRequest';

type Props = NativeStackScreenProps<CarpoolStackParamList, 'TripDetail'>;

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function TripDetailScreen({ route, navigation }: Props) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState<Trajet | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myRequest, setMyRequest] = useState<RideRequest | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [requests, setRequests] = useState<RideRequest[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTrips().then((trips) => setTrip(trips.find((t) => t.id === tripId) ?? null));
      getProfile().then(setProfile);
      getRequestsForTrips([tripId]).then(setRequests);
      getMyRequests().then((reqs) => setMyRequest(reqs.find((r) => r.tripId === tripId) ?? null));
    }, [tripId])
  );

  if (!trip) return null;

  const spot = spots.find((s) => s.id === trip.spotId);
  const placesTotal = trip.placesTotal ?? trip.placesDispo;
  const isDriver = profile != null && trip.conducteurPrenom === profile.prenom;

  async function handleRequest() {
    if (myRequest) return;
    await requestSeat(trip!.id, profile);
    setMyRequest({
      id: `${trip!.id}_pending`,
      tripId: trip!.id,
      passagerUid: '',
      passagerPrenom: profile?.prenom ?? 'Moi',
      status: 'pending',
      date: new Date().toISOString(),
    });
    setShowSheet(true);
  }

  async function handleAccept(request: RideRequest) {
    await acceptRequest(request);
    setRequests((rs) => rs.map((r) => (r.id === request.id ? { ...r, status: 'accepted' } : r)));
    setTrip((t) => (t ? { ...t, placesDispo: t.placesDispo - 1 } : t));
  }

  async function handleRefuse(request: RideRequest) {
    await refuseRequest(request.id);
    setRequests((rs) => rs.map((r) => (r.id === request.id ? { ...r, status: 'refused' } : r)));
  }

  function handleDelete() {
    Alert.alert('Supprimer ce trajet ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteTrip(trip!.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.neutral.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Paris → {spot?.nom ?? 'Spot inconnu'}</Text>
        <Text style={styles.headerSub}>{formatDate(trip.date)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.driverRow}>
            {trip.conducteurPhotoUri ? (
              <Image source={{ uri: trip.conducteurPhotoUri }} style={styles.driverPhoto} />
            ) : (
              <View style={styles.driverPhotoPlaceholder} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{trip.conducteurPrenom}</Text>
              <Text style={styles.driverSub}>Conducteur·rice</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>ITINÉRAIRE</Text>
          <View style={styles.itineraryRow}>
            <View style={styles.itineraryLine}>
              <View style={styles.dotStart} />
              <View style={styles.line} />
              <View style={styles.dotEnd} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.itineraryStep}>
                <Text style={styles.itineraryTime}>{trip.heureDepart} · {trip.adresseDepart}</Text>
                {trip.adresseDepartDetail && <Text style={styles.itinerarySub}>{trip.adresseDepartDetail}</Text>}
              </View>
              <View style={styles.itineraryStep}>
                <Text style={styles.itineraryTime}>{spot?.nom ?? 'Spot inconnu'}</Text>
                {trip.heureRetourEstimee && (
                  <Text style={styles.itinerarySub}>Retour prévu vers {trip.heureRetourEstimee}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.factRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.factLabel}>RETOUR</Text>
              <Text style={styles.factValue}>{trip.heureRetourEstimee ?? '—'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.factLabel}>MATÉRIEL</Text>
              <Text style={styles.factValue}>{trip.materielMax ?? '—'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.factLabel}>PLACES</Text>
              <Text style={styles.factValue}>{trip.placesDispo} sur {placesTotal}</Text>
            </View>
          </View>
        </View>

        {isDriver ? (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>DEMANDES REÇUES · {requests.length || 'AUCUNE'}</Text>
            {requests.length === 0 ? (
              <Text style={styles.emptyRequests}>Personne n'a encore demandé de place.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {requests.map((req) => (
                  <View key={req.id} style={styles.requestRow}>
                    {req.passagerPhotoUri ? (
                      <Image source={{ uri: req.passagerPhotoUri }} style={styles.requestAvatar} />
                    ) : (
                      <View style={[styles.requestAvatar, styles.requestAvatarPlaceholder]} />
                    )}
                    <Text style={styles.requestName}>{req.passagerPrenom}</Text>
                    {req.status === 'pending' ? (
                      <View style={styles.requestActions}>
                        <Pressable style={styles.refuseButton} onPress={() => handleRefuse(req)}>
                          <Text style={styles.refuseButtonText}>Refuser</Text>
                        </Pressable>
                        <Pressable style={styles.acceptButton} onPress={() => handleAccept(req)}>
                          <Text style={styles.acceptButtonText}>Accepter</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={req.status === 'accepted' ? styles.statusBadgeGood : styles.statusBadge}>
                        <Text style={req.status === 'accepted' ? styles.statusBadgeGoodText : styles.statusBadgeText}>
                          {req.status === 'accepted' ? 'ACCEPTÉE' : 'REFUSÉE'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          (trip.dejaABord?.length || myRequest?.status === 'accepted') && (
            <View style={styles.card}>
              <Text style={styles.eyebrow}>DÉJÀ À BORD</Text>
              <View style={styles.boardRow}>
                {trip.dejaABord?.map((name) => (
                  <View key={name} style={styles.boardPerson}>
                    <View style={styles.boardAvatar} />
                    <Text style={styles.boardName}>{name}</Text>
                  </View>
                ))}
                {myRequest?.status === 'accepted' && (
                  <View style={styles.boardPerson}>
                    <View style={[styles.boardAvatar, styles.boardAvatarMe]} />
                    <Text style={styles.boardName}>Toi</Text>
                  </View>
                )}
              </View>
            </View>
          )
        )}
      </ScrollView>

      {isDriver ? (
        <View style={styles.footer}>
          <View style={styles.driverActionsRow}>
            <Pressable
              style={styles.editButton}
              onPress={() => navigation.navigate('CreateTrip', { tripId: trip.id })}
            >
              <Text style={styles.editButtonText}>MODIFIER</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>SUPPRIMER</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.footer}>
          <Pressable
            style={[styles.cta, myRequest && styles.ctaDisabled]}
            onPress={handleRequest}
            disabled={myRequest != null}
          >
            <Text style={[styles.ctaText, myRequest && styles.ctaTextDisabled]}>
              {myRequest?.status === 'accepted'
                ? 'PLACE CONFIRMÉE'
                : myRequest?.status === 'refused'
                  ? 'DEMANDE REFUSÉE'
                  : myRequest
                    ? 'DEMANDE EN ATTENTE'
                    : 'DEMANDER UNE PLACE'}
            </Text>
          </Pressable>
        </View>
      )}

      <Modal visible={showSheet} transparent animationType="fade">
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetIcon}>
              <Ionicons name="checkmark" size={24} color={colors.status.good} />
            </View>
            <Text style={styles.sheetTitle}>Demande envoyée</Text>
            <Text style={styles.sheetBody}>
              {trip.conducteurPrenom} reçoit une notification. Tu verras la réponse dans ton
              profil, onglet Prochain trajet.
            </Text>
            <Pressable style={styles.sheetButton} onPress={() => setShowSheet(false)}>
              <Text style={styles.sheetButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.background },
  header: { backgroundColor: colors.navyBase, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white(0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: typography.h1.fontFamily, fontSize: 25, color: colors.neutral.white, letterSpacing: -0.5, marginTop: 14 },
  headerSub: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.white(0.6), marginTop: 5 },
  content: { padding: 14, paddingBottom: 20 },
  card: { backgroundColor: colors.neutral.white, borderRadius: 14, padding: 14, marginBottom: 10 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  driverPhoto: { width: 48, height: 48, borderRadius: 24 },
  driverPhotoPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#CBD8E0' },
  driverName: { fontFamily: typography.h1.fontFamily, fontSize: 16, color: colors.navyBase },
  driverSub: { ...typography.body, color: colors.navy(0.5), marginTop: 2 },
  eyebrow: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.navy(0.55), letterSpacing: 1, marginBottom: 13 },
  itineraryRow: { flexDirection: 'row', gap: 12 },
  itineraryLine: { alignItems: 'center', paddingTop: 4 },
  dotStart: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: colors.blue },
  line: { width: 2, flex: 1, backgroundColor: colors.navy(0.15), minHeight: 30 },
  dotEnd: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: colors.status.good },
  itineraryStep: { marginBottom: 22 },
  itineraryTime: { fontFamily: typography.h3.fontFamily, fontSize: 14, color: colors.navyBase },
  itinerarySub: { ...typography.body, color: colors.navy(0.5), marginTop: 2 },
  factRow: { flexDirection: 'row', marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.navy(0.08) },
  factLabel: { ...typography.caption, color: colors.navy(0.45) },
  factValue: { fontFamily: typography.h3.fontFamily, fontSize: 13, color: colors.navyBase, marginTop: 2 },
  boardRow: { flexDirection: 'row', gap: 14 },
  boardPerson: { alignItems: 'center', gap: 6 },
  boardAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#B9CBD6' },
  boardAvatarMe: { backgroundColor: colors.accent[100], borderWidth: 1.5, borderColor: colors.accent[500], borderStyle: 'dashed' },
  boardName: { fontFamily: typography.h3.fontFamily, fontSize: 11, color: colors.navy(0.65) },
  emptyRequests: { ...typography.body, color: colors.navy(0.5) },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  requestAvatar: { width: 36, height: 36, borderRadius: 18 },
  requestAvatarPlaceholder: { backgroundColor: '#CBD8E0' },
  requestName: { flex: 1, fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.navyBase },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FDF3E3' },
  statusBadgeText: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: '#9A6200' },
  statusBadgeGood: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EAF7F1' },
  statusBadgeGoodText: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.status.good },
  requestActions: { flexDirection: 'row', gap: 7 },
  refuseButton: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F0F4F7' },
  refuseButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 11.5, color: colors.navy(0.6) },
  acceptButton: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.accent[500] },
  acceptButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 11.5, color: colors.neutral.white },
  footer: { padding: 12, paddingBottom: 20, backgroundColor: colors.neutral.white, borderTopWidth: 1, borderTopColor: colors.navy(0.09) },
  driverActionsRow: { flexDirection: 'row', gap: 10 },
  editButton: { flex: 1, backgroundColor: colors.navyBase, borderRadius: 13, paddingVertical: 16, alignItems: 'center' },
  editButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 14, color: colors.neutral.white, letterSpacing: 0.3 },
  deleteButton: { flex: 1, backgroundColor: '#FBE9E7', borderRadius: 13, paddingVertical: 16, alignItems: 'center' },
  deleteButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 14, color: '#C0392B', letterSpacing: 0.3 },
  cta: { backgroundColor: colors.accent[500], borderRadius: 13, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { backgroundColor: '#F0F4F7' },
  ctaText: { fontFamily: typography.h3.fontFamily, fontSize: 14, color: colors.neutral.white, letterSpacing: 0.3 },
  ctaTextDisabled: { color: colors.navy(0.45) },
  sheetBackdrop: { flex: 1, backgroundColor: colors.navy(0.45), justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.neutral.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 26, paddingBottom: 34 },
  sheetIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#EAF7F1', alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontFamily: typography.h1.fontFamily, fontSize: 20, color: colors.navyBase, marginTop: 16 },
  sheetBody: { ...typography.body, color: colors.navy(0.65), marginTop: 8, lineHeight: 19 },
  sheetButton: { backgroundColor: colors.navyBase, borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  sheetButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.neutral.white, letterSpacing: 0.3 },
});
