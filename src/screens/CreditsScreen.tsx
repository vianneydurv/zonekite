import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../theme';
import { spots } from '../data/spots';
import { spotPhotos } from '../data/spotPhotos';
import { commonsPageUrl } from '../lib/credits';

// Sources de données et crédits exigés par leurs licences (OpenStreetMap,
// Open-Meteo, photos Wikimedia Commons).
const SOURCES: { name: string; use: string; licence: string; url: string }[] = [
  {
    name: 'Open-Meteo',
    use: 'Prévisions de vent et de météo',
    licence: 'Données sous licence CC BY 4.0',
    url: 'https://open-meteo.com',
  },
  {
    name: 'OpenStreetMap',
    use: 'Fonds de carte',
    licence: '© les contributeurs OpenStreetMap, licence ODbL',
    url: 'https://www.openstreetmap.org/copyright',
  },
  {
    name: 'Leaflet',
    use: 'Affichage des cartes',
    licence: 'Licence BSD-2-Clause',
    url: 'https://leafletjs.com',
  },
  {
    name: 'Base Adresse Nationale',
    use: 'Localisation du point de départ',
    licence: 'Licence Ouverte Etalab 2.0',
    url: 'https://adresse.data.gouv.fr',
  },
];

export default function CreditsScreen() {
  const navigation = useNavigation();
  const photos = spots.filter((spot) => spotPhotos[spot.id] && spot.photoUrl);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color={colors.neutral.white} />
        </Pressable>
        <Text style={styles.headerTitle}>CRÉDITS ET SOURCES</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>DONNÉES</Text>
        <View style={styles.card}>
          {SOURCES.map((source, i) => (
            <Pressable
              key={source.name}
              style={[styles.row, i > 0 && styles.rowBorder]}
              onPress={() => Linking.openURL(source.url)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{source.name}</Text>
                <Text style={styles.rowSub}>{source.use}</Text>
                <Text style={styles.rowLicence}>{source.licence}</Text>
              </View>
              <Ionicons name="open-outline" size={15} color={colors.navy(0.35)} />
            </Pressable>
          ))}
        </View>
        <Text style={styles.note}>
          Les marées sont estimées par ZoneKite à partir du cycle lunaire : elles sont indicatives et ne
          remplacent pas l'annuaire officiel du SHOM.
        </Text>

        {photos.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PHOTOS DES SPOTS</Text>
            <Text style={styles.note}>
              Photos issues de Wikimedia Commons, sous licences libres. Touche un spot pour voir l'auteur et la
              licence de sa photo.
            </Text>
            <View style={styles.card}>
              {photos.map((spot, i) => (
                <Pressable
                  key={spot.id}
                  style={[styles.row, i > 0 && styles.rowBorder]}
                  onPress={() => Linking.openURL(commonsPageUrl(spot.photoUrl!))}
                >
                  <Text style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1}>{spot.nom}</Text>
                  <Ionicons name="open-outline" size={15} color={colors.navy(0.35)} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.background },
  header: {
    backgroundColor: colors.navyBase,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white(0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: typography.h1.fontFamily, fontSize: 17, color: colors.neutral.white, letterSpacing: 0.5 },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { ...typography.mono, color: colors.navy(0.5), letterSpacing: 1.2, marginTop: 10, marginBottom: 8 },
  card: { backgroundColor: colors.neutral.white, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.navy(0.07) },
  rowTitle: { fontFamily: typography.h3.fontFamily, fontSize: 14, color: colors.navyBase },
  rowSub: { ...typography.body, fontSize: 12.5, color: colors.navy(0.65), marginTop: 2 },
  rowLicence: { ...typography.caption, color: colors.navy(0.45), marginTop: 2 },
  note: { ...typography.body, fontSize: 12.5, lineHeight: 18, color: colors.navy(0.55), marginTop: 10, marginBottom: 10 },
});
