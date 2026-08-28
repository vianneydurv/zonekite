import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarpoolStackParamList } from '../navigation/CarpoolStackNavigator';
import { spots } from '../data/spots';
import { colors, typography } from '../theme';
import { getTrips } from '../lib/tripsStorage';
import { getRequestedTripIds, requestSeat } from '../lib/rideRequests';
import type { Trajet } from '../types/trajet';

type Props = NativeStackScreenProps<CarpoolStackParamList, 'TripDetail'>;

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function TripDetailScreen({ route, navigation }: Props) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState<Trajet | null>(null);
  const [requested, setRequested] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getTrips().then((trips) => setTrip(trips.find((t) => t.id === tripId) ?? null));
      getRequestedTripIds().then((ids) => setRequested(ids.includes(tripId)));
    }, [tripId])
  );

  if (!trip) return null;

  const spot = spots.find((s) => s.id === trip.spotId);
  const placesTotal = trip.placesTotal ?? trip.placesDispo;

  async function handleRequest() {
    if (requested) return;
    await requestSeat(trip!.id);
    setRequested(true);
    setShowSheet(true);
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

        {(trip.dejaABord?.length || requested) && (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>DÉJÀ À BORD</Text>
            <View style={styles.boardRow}>
              {trip.dejaABord?.map((name) => (
                <View key={name} style={styles.boardPerson}>
                  <View style={styles.boardAvatar} />
                  <Text style={styles.boardName}>{name}</Text>
                </View>
              ))}
              {requested && (
                <View style={styles.boardPerson}>
                  <View style={[styles.boardAvatar, styles.boardAvatarMe]} />
                  <Text style={styles.boardName}>Toi</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.cta, requested && styles.ctaDisabled]}
          onPress={handleRequest}
          disabled={requested}
        >
          <Text style={[styles.ctaText, requested && styles.ctaTextDisabled]}>
            {requested ? 'DEMANDE EN ATTENTE' : 'DEMANDER UNE PLACE'}
          </Text>
        </Pressable>
      </View>

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
  footer: { padding: 12, paddingBottom: 20, backgroundColor: colors.neutral.white, borderTopWidth: 1, borderTopColor: colors.navy(0.09) },
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
