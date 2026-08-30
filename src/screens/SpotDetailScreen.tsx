import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, typography } from '../theme';
import { getTrips } from '../lib/tripsStorage';
import {
  directionToBarPercent,
  getHourlyConditions,
  getSpotCondition,
  localDateIso,
  type HourCondition,
  type SpotCondition,
} from '../lib/matching';
import { getFavoriteIds, toggleFavorite } from '../lib/favorites';
import type { Spot } from '../types/spot';

// Plage horaire pertinente pour le kite (cohérente avec la recherche).
const DISPLAY_HOURS_START = 6;
const DISPLAY_HOURS_END = 22;
// Écart rafale - vent moyen (nds) à partir duquel on considère le vent rafaleux.
const GUST_THRESHOLD_KN = 6;
const LEVEL_COLORS = { bon: '#17A673', moyen: '#F0A020', mauvais: '#E04B3C' };

interface Props {
  route: {
    params: {
      spot: Spot;
      searchDate?: string;
      searchStartHour?: number;
      searchEndHour?: number;
    };
  };
}

function formatHourNumber(h: number): string {
  return `${h}h00`;
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
  const { spot, searchDate, searchStartHour, searchEndHour } = route.params;
  const navigation = useNavigation<any>();
  const [fav, setFav] = useState(false);
  const [carpoolCount, setCarpoolCount] = useState(0);
  const [condition, setCondition] = useState<SpotCondition | null>(null);
  const [hourly, setHourly] = useState<HourCondition[]>([]);
  const [selectedHourIndex, setSelectedHourIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getTrips().then((trips) => setCarpoolCount(trips.filter((t) => t.spotId === spot.id).length));
      getFavoriteIds().then((ids) => setFav(ids.includes(spot.id)));
    }, [spot.id])
  );

  useEffect(() => {
    const dateIso = localDateIso(new Date());
    const hourRange = searchStartHour != null && searchEndHour != null
      ? { start: searchStartHour, end: searchEndHour }
      : undefined;
    getSpotCondition(spot, dateIso, hourRange).then(setCondition);
    getHourlyConditions(spot, dateIso).then((list) => {
      const hour = (h: HourCondition) => Number(h.hourLabel.replace('h', ''));
      const filtered = list.filter((h) => hour(h) >= DISPLAY_HOURS_START && hour(h) <= DISPLAY_HOURS_END);
      setHourly(filtered);
      const nowHour = new Date().getHours();
      const closest = filtered.findIndex((h) => hour(h) >= nowHour);
      setSelectedHourIndex(closest === -1 ? 0 : closest);
    });
  }, [spot.id, searchStartHour, searchEndHour]);

  const selected = hourly[selectedHourIndex] ?? null;

  const windMin = spot.ventMinNoeuds ?? 12;
  const windMax = spot.ventMaxNoeuds ?? 30;
  const windPct = selected
    ? Math.max(0, Math.min(100, ((selected.windSpeedKn - windMin) / (windMax - windMin)) * 100))
    : 0;
  const gustDelta = selected ? selected.windGustKn - selected.windSpeedKn : 0;
  const isGusty = gustDelta >= GUST_THRESHOLD_KN;
  const windDirPct = selected ? directionToBarPercent(selected.windDir) : 50;
  const idealDirZone = (() => {
    const favorables = spot.directionsFavorables;
    if (!favorables || favorables.length === 0) return { left: 35, width: 40 };
    const pcts = favorables.map(directionToBarPercent);
    const min = Math.min(...pcts);
    const max = Math.max(...pcts);
    return { left: min, width: Math.max(max - min, 6) };
  })();

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

  if (!condition || !selected) {
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
            <Text style={styles.cardEyebrow}>PRÉVISIONS</Text>
          </View>

          <View style={styles.sliderCard}>
            <View style={[styles.sliderHourPill, { backgroundColor: LEVEL_COLORS[selected.level] }]}>
              <Text style={styles.sliderHourPillText}>{selected.hourLabel}</Text>
            </View>

            <View style={styles.sliderTrackWrap}>
              <View style={styles.sliderHeatmap}>
                {hourly.map((h, i) => (
                  <View key={i} style={[styles.sliderHeatmapSegment, { backgroundColor: LEVEL_COLORS[h.level] }]} />
                ))}
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={Math.max(hourly.length - 1, 0)}
                step={1}
                value={selectedHourIndex}
                onValueChange={setSelectedHourIndex}
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                thumbTintColor={colors.neutral.white}
              />
            </View>

            <View style={styles.sliderEdgeRow}>
              <Text style={styles.sliderEdgeLabel}>{DISPLAY_HOURS_START}h</Text>
              <Text style={styles.sliderEdgeLabel}>{DISPLAY_HOURS_END}h</Text>
            </View>
          </View>

          <View style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Force du vent</Text>
              <Text style={styles.barValue}>{selected.windSpeedKn} nds</Text>
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
                {selected.windDir}{' '}
                <Text style={styles.barValueMuted}>
                  / idéal {spot.directionsFavorables?.join('–') ?? '—'}
                </Text>
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barIdealZone,
                  { left: `${idealDirZone.left}%`, width: `${idealDirZone.width}%` },
                ]}
              />
              <View style={[styles.barMarker, { left: `${windDirPct}%` }]} />
            </View>
            <View style={styles.dirScaleRow}>
              <Text style={styles.dirScaleLabel}>O</Text>
              <Text style={styles.dirScaleLabel}>N/S</Text>
              <Text style={styles.dirScaleLabel}>E</Text>
            </View>
          </View>

          <View style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Marée</Text>
              <Text style={styles.barValue}>{selected.tideLabel}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barIdealZone, styles.barIdealZoneTide, { left: '20%', width: '46%' }]} />
              <View style={[styles.barMarker, styles.barMarkerTide, { left: '34%' }]} />
            </View>
          </View>

          <View style={[styles.barRow, { marginBottom: 0 }]}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>Rafales</Text>
              <Text style={[styles.barValue, isGusty && styles.barValueWarning]}>
                {selected.windGustKn} nds · {isGusty ? 'Vent rafaleux' : 'Vent stable'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardFootnote}>
            {TIDE_LABELS[spot.contrainteMaree]}
            {spot.contrainteMareeDetail ? ` — ${spot.contrainteMareeDetail}` : ''}
          </Text>

          {spot.windguruId != null && (
            <Pressable
              style={styles.windguruButton}
              onPress={() => Linking.openURL(`https://www.windguru.cz/${spot.windguruId}`)}
            >
              <Ionicons name="open-outline" size={15} color={colors.blue} />
              <Text style={styles.windguruButtonText}>VOIR SUR WINDGURU</Text>
            </Pressable>
          )}
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
          onPress={() =>
            carpoolCount > 0
              ? navigation.getParent()?.navigate('Carpool')
              : navigation.getParent()?.navigate('Carpool', {
                  screen: 'CreateTrip',
                  params: {
                    spotId: spot.id,
                    date: searchDate,
                    heureDepart: searchStartHour != null ? formatHourNumber(searchStartHour) : undefined,
                    heureRetour: searchEndHour != null ? formatHourNumber(searchEndHour) : undefined,
                  },
                })
          }
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
  sliderCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderHourPill: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  sliderHourPillText: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 20,
    color: colors.neutral.white,
    letterSpacing: 0.3,
  },
  sliderTrackWrap: { width: '100%', height: 32, justifyContent: 'center' },
  sliderHeatmap: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  sliderHeatmapSegment: { flex: 1 },
  slider: { width: '100%', height: 32 },
  sliderEdgeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 4 },
  sliderEdgeLabel: { ...typography.caption, color: colors.navy(0.4) },
  windguruButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  windguruButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.blue, letterSpacing: 0.4 },
  barRow: { marginBottom: 12 },
  barValueWarning: { color: '#D9530A' },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontFamily: typography.h3.fontFamily, fontSize: 12.5, color: colors.navyBase },
  barValue: { fontFamily: typography.h3.fontFamily, fontSize: 12.5, color: colors.navyBase },
  barValueMuted: { color: colors.navy(0.4), fontFamily: typography.body.fontFamily },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#EDF1F4', marginTop: 7, position: 'relative' },
  barIdealZone: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#CDEBDD', borderRadius: 4 },
  barIdealZoneTide: { backgroundColor: '#FBE7C4' },
  barMarker: { position: 'absolute', top: -3, width: 5, height: 14, borderRadius: 3, backgroundColor: '#17A673' },
  barMarkerTide: { backgroundColor: '#F0A020' },
  dirScaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dirScaleLabel: { ...typography.caption, fontSize: 9.5, color: colors.navy(0.35) },
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
