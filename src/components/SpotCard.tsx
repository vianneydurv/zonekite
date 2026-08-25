import { StyleSheet, Text, View } from 'react-native';
import type { Spot } from '../types/spot';
import { colors, typography } from '../theme';

export default function SpotCard({ spot }: { spot: Spot }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.nom}>{spot.nom}</Text>
        <View style={styles.regionBadge}>
          <Text style={styles.regionText}>{spot.region}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {spot.description}
      </Text>
      <View style={styles.metaRow}>
        {spot.ventMinNoeuds != null && spot.ventMaxNoeuds != null && (
          <Text style={styles.metaText}>
            {spot.ventMinNoeuds}–{spot.ventMaxNoeuds} nds
          </Text>
        )}
        {spot.directionsFavorables && (
          <Text style={styles.metaText}>{spot.directionsFavorables.join(' / ')}</Text>
        )}
      </View>
    </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nom: { ...typography.h3, color: colors.ocean[900], flexShrink: 1 },
  regionBadge: {
    backgroundColor: colors.ocean[50],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  regionText: { ...typography.caption, color: colors.ocean[700] },
  description: { ...typography.body, color: colors.neutral.textSecondary, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaText: { ...typography.caption, color: colors.accent[700], fontWeight: '600' },
});
