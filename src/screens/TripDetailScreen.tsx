import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarpoolStackParamList } from '../navigation/CarpoolStackNavigator';
import { spots } from '../data/spots';
import { colors, typography } from '../theme';

type Props = NativeStackScreenProps<CarpoolStackParamList, 'TripDetail'>;

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function TripDetailScreen({ route }: Props) {
  const { trip } = route.params;
  const spot = spots.find((s) => s.id === trip.spotId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.spotName}>{spot?.nom ?? 'Spot inconnu'}</Text>
      <Text style={styles.dateText}>{formatDate(trip.date)}</Text>

      <View style={styles.driverRow}>
        {trip.conducteurPhotoUri ? (
          <Image source={{ uri: trip.conducteurPhotoUri }} style={styles.driverPhoto} />
        ) : (
          <View style={styles.driverPhotoPlaceholder}>
            <Ionicons name="person" size={20} color={colors.ocean[300]} />
          </View>
        )}
        <Text style={styles.driverName}>Conducteur·rice : {trip.conducteurPrenom}</Text>
      </View>

      <View style={styles.factRow}>
        <Ionicons name="time-outline" size={18} color={colors.ocean[700]} />
        <View style={styles.factTextWrap}>
          <Text style={styles.factLabel}>Départ</Text>
          <Text style={styles.factValue}>{trip.heureDepart}</Text>
        </View>
      </View>

      {trip.heureRetourEstimee && (
        <View style={styles.factRow}>
          <Ionicons name="time-outline" size={18} color={colors.ocean[700]} />
          <View style={styles.factTextWrap}>
            <Text style={styles.factLabel}>Retour estimé</Text>
            <Text style={styles.factValue}>{trip.heureRetourEstimee}</Text>
          </View>
        </View>
      )}

      <View style={styles.factRow}>
        <Ionicons name="location-outline" size={18} color={colors.ocean[700]} />
        <View style={styles.factTextWrap}>
          <Text style={styles.factLabel}>Point de départ</Text>
          <Text style={styles.factValue}>{trip.adresseDepart}</Text>
        </View>
      </View>

      <View style={styles.factRow}>
        <Ionicons name="people-outline" size={18} color={colors.ocean[700]} />
        <View style={styles.factTextWrap}>
          <Text style={styles.factLabel}>Places disponibles</Text>
          <Text style={styles.factValue}>{trip.placesDispo}</Text>
        </View>
      </View>

      <Text style={styles.soliBox}>
        Covoiturage solidaire : aucun paiement géré dans l'app. Les arrangements se font entre
        vous.
      </Text>

      <Pressable
        style={styles.requestButton}
        onPress={() =>
          Alert.alert(
            'Bientôt disponible',
            'Les demandes de réservation nécessitent de vrais comptes membres (Firebase, étape 9+).'
          )
        }
      >
        <Text style={styles.requestButtonText}>DEMANDER UNE PLACE</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  content: { padding: 20, paddingBottom: 40 },
  spotName: { ...typography.h1, color: colors.ocean[900] },
  dateText: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 4, marginBottom: 20, textTransform: 'capitalize' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  driverPhoto: { width: 36, height: 36, borderRadius: 18 },
  driverPhotoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: { ...typography.bodyBold, color: colors.ocean[900] },
  factRow: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  factTextWrap: { flex: 1 },
  factLabel: { ...typography.caption, color: colors.neutral.textSecondary, fontWeight: '600' },
  factValue: { ...typography.bodyBold, color: colors.ocean[900], marginTop: 2 },
  soliBox: {
    ...typography.caption,
    color: colors.neutral.textSecondary,
    backgroundColor: colors.ocean[50],
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  requestButton: {
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  requestButtonText: { ...typography.bodyBold, color: colors.neutral.white, letterSpacing: 0.5 },
});
