import { useCallback, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarpoolStackParamList } from '../navigation/CarpoolStackNavigator';
import { colors, typography } from '../theme';
import { getTrips } from '../lib/tripsStorage';
import { getProfile } from '../lib/profileStorage';
import type { Trajet } from '../types/trajet';
import TripCard from '../components/TripCard';

type Props = NativeStackScreenProps<CarpoolStackParamList, 'CarpoolList'>;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Covoiturage : liste des trajets proposés, création de trajet
export default function CarpoolListScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<Trajet[]>([]);
  const [prenom, setPrenom] = useState<string | null>(null);
  const [mode, setMode] = useState<'seeking' | 'offering'>('seeking');

  useFocusEffect(
    useCallback(() => {
      getTrips().then(setTrips);
      getProfile().then((p) => setPrenom(p?.prenom ?? null));
    }, [])
  );

  const visibleTrips = trips.filter((t) =>
    mode === 'offering' ? t.conducteurPrenom === prenom : t.conducteurPrenom !== prenom
  );

  const todayLabel = capitalize(new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>COVOITURAGE</Text>

        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleButton, mode === 'seeking' && styles.toggleButtonActive]}
            onPress={() => setMode('seeking')}
          >
            <Text style={[styles.toggleText, mode === 'seeking' && styles.toggleTextActive]}>Je cherche</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, mode === 'offering' && styles.toggleButtonActive]}
            onPress={() => setMode('offering')}
          >
            <Text style={[styles.toggleText, mode === 'offering' && styles.toggleTextActive]}>Je propose</Text>
          </Pressable>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chipActive}>
            <Text style={styles.chipActiveText}>{todayLabel.toUpperCase()}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>TOUS LES SPOTS</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={visibleTrips}
        keyExtractor={(trip) => trip.id}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={() => navigation.navigate('TripDetail', { tripId: item.id })} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.listTitle}>
            {mode === 'seeking'
              ? `${visibleTrips.length} TRAJET${visibleTrips.length > 1 ? 'S' : ''}`
              : `MES TRAJETS PROPOSÉS · ${visibleTrips.length || 'AUCUN'}`}
          </Text>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun trajet pour l'instant.</Text>}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateTrip')}>
        <Text style={styles.fabText}>+ PROPOSER UN TRAJET</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.background },
  header: { backgroundColor: colors.navyBase, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  headerTitle: { ...typography.h2, color: colors.neutral.white, letterSpacing: -0.3 },
  toggleRow: { flexDirection: 'row', backgroundColor: colors.white(0.1), borderRadius: 10, padding: 3, marginTop: 14 },
  toggleButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleButtonActive: { backgroundColor: colors.neutral.white },
  toggleText: { fontFamily: typography.h3.fontFamily, fontSize: 12.5, color: colors.white(0.65) },
  toggleTextActive: { color: colors.navyBase },
  chipRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  chipActive: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.accent[500] },
  chipActiveText: { fontFamily: typography.h3.fontFamily, fontSize: 11, color: colors.neutral.white },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.white(0.1) },
  chipText: { fontFamily: typography.body.fontFamily, fontSize: 11, color: colors.white(0.8) },
  listContent: { padding: 14, paddingBottom: 110 },
  listTitle: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.navy(0.55), letterSpacing: 1, marginBottom: 10, marginHorizontal: 2 },
  emptyText: { ...typography.body, color: colors.neutral.textSecondary },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.accent[500],
  },
  fabText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.neutral.white, letterSpacing: 0.3 },
});
