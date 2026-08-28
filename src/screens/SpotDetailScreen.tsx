import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SpotsStackParamList } from '../navigation/SpotsStackNavigator';
import { colors, typography } from '../theme';

type Props = NativeStackScreenProps<SpotsStackParamList, 'SpotDetail'>;

const TIDE_LABELS: Record<string, string> = {
  toutes: 'Navigable à toute marée',
  maree_haute: 'Marée haute',
  maree_basse: 'Marée basse',
  mi_maree_haute: 'Mi-marée à marée haute',
  mi_maree_basse: 'Mi-marée à marée basse',
  variable: 'Variable selon la zone',
  inconnue: 'Non documenté',
};

// Google Maps embarqué via son URL "embed" publique (pas de clé API nécessaire
// pour l'affichage). Reste dans une WebView plutôt qu'une MapView native pour
// rester compatible Expo Go (react-native-maps demanderait un build de dev).
function googleMapsEmbedUrl(lat: number, lon: number) {
  return `https://www.google.com/maps?q=${lat},${lon}&z=13&output=embed`;
}

export default function SpotDetailScreen({ route }: Props) {
  const { spot } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        {spot.photoUrl ? (
          <Image source={{ uri: spot.photoUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <Text style={styles.heroPlaceholder}>Photo à venir</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{spot.region}</Text>
          </View>
          {spot.niveauIndicatif && (
            <View style={[styles.badge, styles.badgeAccent]}>
              <Text style={[styles.badgeText, styles.badgeAccentText]}>{spot.niveauIndicatif}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{spot.nom}</Text>

        <Text style={styles.description}>{spot.description}</Text>

        <Text style={styles.sectionTitle}>Conditions idéales</Text>

        <View style={styles.factRow}>
          <Ionicons name="flag-outline" size={18} color={colors.ocean[700]} />
          <View style={styles.factTextWrap}>
            <Text style={styles.factLabel}>Force du vent</Text>
            <Text style={styles.factValue}>
              {spot.ventMinNoeuds != null && spot.ventMaxNoeuds != null
                ? `${spot.ventMinNoeuds} – ${spot.ventMaxNoeuds} nœuds`
                : 'Non documenté'}
            </Text>
          </View>
        </View>

        <View style={styles.factRow}>
          <Ionicons name="compass-outline" size={18} color={colors.ocean[700]} />
          <View style={styles.factTextWrap}>
            <Text style={styles.factLabel}>Directions favorables</Text>
            <Text style={styles.factValue}>
              {spot.directionsFavorables ? spot.directionsFavorables.join(' · ') : 'Non documenté'}
            </Text>
          </View>
        </View>

        <View style={styles.factRow}>
          <Ionicons name="water-outline" size={18} color={colors.ocean[700]} />
          <View style={styles.factTextWrap}>
            <Text style={styles.factLabel}>Marée</Text>
            <Text style={styles.factValue}>{TIDE_LABELS[spot.contrainteMaree]}</Text>
            {spot.contrainteMareeDetail && (
              <Text style={styles.factDetail}>{spot.contrainteMareeDetail}</Text>
            )}
          </View>
        </View>

        {spot.reglementation && (
          <>
            <Text style={styles.sectionTitle}>Réglementation</Text>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{spot.reglementation}</Text>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Localisation</Text>
        <View style={styles.mapBox}>
          <WebView
            style={styles.map}
            source={{ uri: googleMapsEmbedUrl(spot.lat, spot.lon) }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  hero: {
    height: 160,
    backgroundColor: colors.ocean[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { ...typography.caption, color: colors.ocean[100] },
  content: { padding: 20, paddingBottom: 40 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: {
    backgroundColor: colors.ocean[50],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeAccent: { backgroundColor: colors.accent[100] },
  badgeText: { ...typography.caption, color: colors.ocean[700], fontWeight: '600' },
  badgeAccentText: { color: colors.accent[700] },
  title: { ...typography.h1, color: colors.ocean[900], marginBottom: 12 },
  description: { ...typography.body, color: colors.neutral.textSecondary, marginBottom: 24 },
  sectionTitle: { ...typography.h3, color: colors.ocean[900], marginBottom: 12, marginTop: 4 },
  factRow: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  factTextWrap: { flex: 1 },
  factLabel: { ...typography.caption, color: colors.neutral.textSecondary, fontWeight: '600' },
  factValue: { ...typography.bodyBold, color: colors.ocean[900], marginTop: 2 },
  factDetail: { ...typography.caption, color: colors.neutral.textSecondary, marginTop: 2 },
  warningBox: { backgroundColor: colors.accent[100], borderRadius: 12, padding: 14, marginBottom: 8 },
  warningText: { ...typography.caption, color: colors.accent[700] },
  mapBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    height: 240,
    overflow: 'hidden',
  },
  map: { flex: 1 },
});
