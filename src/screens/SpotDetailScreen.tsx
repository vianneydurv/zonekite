import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, typography } from '../theme';
import { getTrips } from '../lib/tripsStorage';
import { getSpotCondition, localDateIso, type SpotCondition } from '../lib/matching';
import { getFavoriteIds, toggleFavorite } from '../lib/favorites';
import type { Spot } from '../types/spot';

interface Props {
  route: { params: { spot: Spot } };
}

const TIDE_LABELS: Record<string, string> = {
  toutes: 'Navigable à toute marée',
  maree_haute: 'Marée haute',
  maree_basse: 'Marée basse',
  mi_maree_haute: 'Mi-marée à marée haute',
  mi_maree_basse: 'Mi-marée à marée basse',
  variable: 'Variable selon la zone',
  inconnue: 'Non documenté',
};

function openItinerary(spot: Spot) {
  const label = encodeURIComponent(spot.nom);
  Linking.openURL(`https://maps.apple.com/?daddr=${spot.lat},${spot.lon}&q=${label}&dirflg=d`);
}

export default function SpotDetailScreen({ route }: Props) {
  const { spot } = route.params;
  const navigation = useNavigation<any>();
  const [fav, setFav] = useState(false);
  const [carpoolCount, setCarpoolCount] = useState(0);
  const [condition, setCondition] = useState<SpotCondition | null>(null);

  useFocusEffect(
    useCallback(() => {
      getTrips().then((trips) => setCarpoolCount(trips.filter((t) => t.spotId === spot.id).length));
      getFavoriteIds().then((ids) => setFav(ids.includes(spot.id)));
    }, [spot.id])
  );

  useEffect(() => {
    getSpotCondition(spot, localDateIso(new Date())).then(setCondition);
  }, [spot.id]);

  const windMin = spot.ventMinNoeuds ?? 12;
  const windMax = spot.ventMaxNoeuds ?? 30;
  const windPct = condition
    ? Math.max(0, Math.min(100, ((condition.windSpeed - windMin) / (windMax - windMin)) * 100))
    : 0;

  const hero = (
    <View>
      <View style={styles.hero}>
        {spot.photoUrl ? (
          <Image source={{ uri: spot.photoUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="image-outline" size={32} color={colors.navy(0.3)} />
          </View>
        )}
      </View>
      <Pressable style={styles.itineraryBar} onPress={() => openItinerary(spot)}>
        <Ionicons name="navigate" size={15} color={colors.blue} />
        <Text style={styles.itineraryBarText}>ITINÉRAIRE</Text>
      </Pressable>
    </View>
  );

  if (!condition) {
    return (
      <View style={styles.container}>
        {hero}
        <View style={styles.loadingBanner}>
          <Text style={styles.loadingText}>Récupération des conditions…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hero}

      <View style={[styles.verdictBanner, { backgroundColor: condition.color }]}>
        <Text style={styles.verdictText}>{condition.verdict}</Text>
        <Text style={styles.verdictWindow}>{condition.window}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{spot.nom}</Text>
        <Text style={styles.location}>{spot.region}</Text>

        <View style={styles.badgeRow}>
          {spot.niveauIndicatif && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{spot.niveauIndicatif.toUpperCase()}</Text>
            </View>
          )}
          {spot.contrainteMaree !== 'toutes' && (
            <View style={[styles.badge, styles.badgeNeutral]}>
              <Text style={[styles.badgeText, styles.badgeNeutralText]}>MARÉE SENSIBLE</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardEyebrow}>MAINTENANT vs IDÉAL</Text>
            <Text style={styles.cardEyebrowValue}>aujourd'hui</Text>
          </View>

          <View style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Force du vent</Text>
              <Text style={styles.barValue}>{condition.windSpeed} nds</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barIdealZone,
                  { left: '20%', width: '60%' },
                ]}
              />
              <View style={[styles.barMarker, { left: `${windPct}%` }]} />
            </View>
          </View>

          <View style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Direction</Text>
              <Text style={styles.barValue}>
                {condition.windDir}{' '}
                <Text style={styles.barValueMuted}>
                  / idéal {spot.directionsFavorables?.join('–') ?? '—'}
                </Text>
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barIdealZone, { left: '35%', width: '40%' }]} />
              <View style={[styles.barMarker, { left: '50%' }]} />
            </View>
          </View>

          <View style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Marée</Text>
              <Text style={styles.barValue}>{condition.tideLabel}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barIdealZone, styles.barIdealZoneTide, { left: '20%', width: '46%' }]} />
              <View style={[styles.barMarker, styles.barMarkerTide, { left: '34%' }]} />
            </View>
          </View>

          <Text style={styles.cardFootnote}>
            {TIDE_LABELS[spot.contrainteMaree]}
            {spot.contrainteMareeDetail ? ` — ${spot.contrainteMareeDetail}` : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>LE SPOT</Text>
          <Text style={styles.description}>{spot.description}</Text>
        </View>

        {spot.reglementation && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{spot.reglementation}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.footerCta}
          onPress={() => navigation.getParent()?.navigate('Carpool')}
        >
          <Text style={styles.footerCtaText}>
            {carpoolCount > 0
              ? `${carpoolCount} COVOIT${carpoolCount > 1 ? 'S' : ''} POUR CE SPOT`
              : 'PROPOSER UN COVOIT'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.favButton, fav && styles.favButtonActive]}
          onPress={() => toggleFavorite(spot.id).then((ids) => setFav(ids.includes(spot.id)))}
        >
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? colors.accent[500] : colors.blue} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  hero: { height: 200 },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.ocean[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itineraryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.navy(0.08),
  },
  itineraryBarText: { fontFamily: typography.h3.fontFamily, fontSize: 12.5, color: colors.blue, letterSpacing: 0.5 },
  verdictBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  loadingBanner: { padding: 16, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.navy(0.5) },
  verdictText: { ...typography.caption, color: colors.neutral.white, letterSpacing: 1.1, fontFamily: typography.h3.fontFamily },
  verdictWindow: { ...typography.bodyBold, color: colors.neutral.white },
  content: { padding: 15, paddingBottom: 20 },
  title: { ...typography.h1, color: colors.navyBase, letterSpacing: -0.5 },
  location: { ...typography.body, color: colors.navy(0.5), marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 11, flexWrap: 'wrap' },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#E7F1F7' },
  badgeText: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.blue, letterSpacing: 0.5 },
  badgeNeutral: { backgroundColor: colors.neutral.white },
  badgeNeutralText: { color: colors.navy(0.6) },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    padding: 14,
    marginTop: 13,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 13 },
  cardEyebrow: { ...typography.caption, color: colors.navy(0.55), letterSpacing: 1 },
  cardEyebrowValue: { ...typography.caption, color: colors.navy(0.3) },
  barRow: { marginBottom: 12 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontFamily: typography.h3.fontFamily, fontSize: 12.5, color: colors.navyBase },
  barValue: { fontFamily: typography.h3.fontFamily, fontSize: 12.5, color: colors.navyBase },
  barValueMuted: { color: colors.navy(0.4), fontFamily: typography.body.fontFamily },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#EDF1F4', marginTop: 7, position: 'relative' },
  barIdealZone: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#CDEBDD', borderRadius: 4 },
  barIdealZoneTide: { backgroundColor: '#FBE7C4' },
  barMarker: { position: 'absolute', top: -3, width: 5, height: 14, borderRadius: 3, backgroundColor: '#17A673' },
  barMarkerTide: { backgroundColor: '#F0A020' },
  cardFootnote: { ...typography.body, color: colors.navy(0.65), marginTop: 4, paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.navy(0.07) },
  description: { ...typography.body, color: colors.navy(0.8), marginTop: 8, lineHeight: 19 },
  warningBox: { backgroundColor: colors.accent[100], borderRadius: 12, padding: 14, marginTop: 13 },
  warningText: { ...typography.caption, color: colors.accent[700] },
  footer: {
    flexDirection: 'row',
    gap: 9,
    padding: 12,
    paddingBottom: 20,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.navy(0.09),
  },
  footerCta: {
    flex: 1,
    backgroundColor: colors.accent[500],
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
  },
  footerCtaText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.neutral.white, letterSpacing: 0.3 },
  favButton: {
    width: 56,
    borderRadius: 13,
    backgroundColor: '#F0F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favButtonActive: { backgroundColor: colors.accent[100] },
});
