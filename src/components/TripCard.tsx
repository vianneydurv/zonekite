import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Trajet } from '../types/trajet';
import { spots } from '../data/spots';
import { colors, typography } from '../theme';

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function TripCard({ trip, onPress }: { trip: Trajet; onPress?: () => void }) {
  const spot = spots.find((s) => s.id === trip.spotId);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.spotName}>{spot?.nom ?? 'Spot inconnu'}</Text>
        <View style={styles.placesBadge}>
          <Text style={styles.placesText}>
            {trip.placesDispo} place{trip.placesDispo > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <Text style={styles.dateText}>{formatDate(trip.date)} · départ {trip.heureDepart}</Text>

      <View style={styles.footerRow}>
        <Ionicons name="location-outline" size={14} color={colors.neutral.textSecondary} />
        <Text style={styles.footerText}>{trip.adresseDepart}</Text>
        <Text style={styles.footerDot}>·</Text>
        <Text style={styles.footerText}>{trip.conducteurPrenom}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  spotName: { ...typography.h3, color: colors.ocean[900], flexShrink: 1 },
  placesBadge: {
    backgroundColor: colors.accent[100],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  placesText: { ...typography.caption, color: colors.accent[700], fontWeight: '700' },
  dateText: { ...typography.bodyBold, color: colors.ocean[700], marginBottom: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { ...typography.caption, color: colors.neutral.textSecondary },
  footerDot: { ...typography.caption, color: colors.neutral.textSecondary, marginHorizontal: 2 },
});
