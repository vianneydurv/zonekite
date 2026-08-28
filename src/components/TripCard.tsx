import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Trajet } from '../types/trajet';
import { spots } from '../data/spots';
import { colors, typography } from '../theme';

const AVATAR_COLORS = ['#CBD8E0', '#B9CBD6', '#A8BFCC', '#97B3C2'];

function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function TripCard({ trip, onPress }: { trip: Trajet; onPress?: () => void }) {
  const spot = spots.find((s) => s.id === trip.spotId);
  const isFull = trip.placesDispo <= 0;

  return (
    <Pressable style={[styles.card, isFull && styles.cardFull]} onPress={onPress} disabled={isFull}>
      <View style={styles.topRow}>
        {trip.conducteurPhotoUri ? (
          <Image source={{ uri: trip.conducteurPhotoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: avatarColor(trip.conducteurPrenom) }]} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.driver}>{trip.conducteurPrenom}</Text>
          {trip.vehicule && <Text style={styles.car}>{trip.vehicule}</Text>}
        </View>
        {isFull && (
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>COMPLET</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.fieldLabel}>DESTINATION</Text>
          <Text style={styles.destination}>{spot?.nom ?? 'Spot inconnu'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.fieldLabel}>DÉPART</Text>
          <Text style={styles.depart}>{trip.heureDepart} · {trip.adresseDepart}</Text>
        </View>
      </View>

      {!isFull && (
        <View style={styles.footerRow}>
          <Text style={styles.seats}>
            {trip.placesDispo} place{trip.placesDispo > 1 ? 's' : ''} libre{trip.placesDispo > 1 ? 's' : ''}
          </Text>
          <View style={styles.demandButton}>
            <Text style={styles.demandButtonText}>Demander</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },
  cardFull: { opacity: 0.72 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  driver: { fontFamily: typography.h1.fontFamily, fontSize: 14.5, color: colors.navyBase },
  car: { ...typography.body, color: colors.navy(0.5), marginTop: 2 },
  fullBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F0F4F7' },
  fullBadgeText: { fontFamily: typography.h3.fontFamily, fontSize: 11, color: colors.navy(0.5) },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.navy(0.08),
  },
  fieldLabel: { ...typography.caption, color: colors.navy(0.45) },
  destination: { fontFamily: typography.h1.fontFamily, fontSize: 16, color: colors.navyBase, marginTop: 2 },
  depart: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.navyBase, marginTop: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  seats: { fontFamily: typography.h3.fontFamily, fontSize: 11.5, color: colors.navy(0.6) },
  demandButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.accent[500] },
  demandButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.neutral.white },
});
