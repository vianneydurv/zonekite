import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarpoolStackParamList } from '../navigation/CarpoolStackNavigator';
import { colors, typography } from '../theme';
import { getTrips } from '../lib/tripsStorage';
import type { Trajet } from '../types/trajet';
import TripCard from '../components/TripCard';

type Props = NativeStackScreenProps<CarpoolStackParamList, 'CarpoolList'>;

// Covoiturage : liste des trajets proposés, création de trajet
export default function CarpoolListScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<Trajet[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTrips().then(setTrips);
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(trip) => trip.id}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={() => navigation.navigate('TripDetail', { trip: item })} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Covoiturage</Text>
            <Text style={styles.subtitle}>Organisez vos trajets vers les spots</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun trajet proposé pour l'instant.</Text>}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateTrip')}>
        <Ionicons name="add" size={24} color={colors.neutral.white} />
        <Text style={styles.fabText}>Proposer un trajet</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  listContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  title: { ...typography.h1, color: colors.ocean[900] },
  subtitle: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 8, marginBottom: 16 },
  emptyText: { ...typography.body, color: colors.neutral.textSecondary },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.accent[500],
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fabText: { ...typography.bodyBold, color: colors.neutral.white },
});
