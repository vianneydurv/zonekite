import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import {
  DEFAULT_WIND_MAX_KN,
  DEFAULT_WIND_MIN_KN,
  getHourlyConditions,
  localDateIso,
  type HourCondition,
  type Level,
} from '../lib/matching';
import type { Spot } from '../types/spot';

// Tableau de prévisions heure par heure, inspiré de Windguru : une colonne
// par heure, une ligne par critère, chaque case colorée selon qu'elle est
// idéale (vert), limite (orange) ou non navigable (rouge) pour CE spot.

const HOURS_START = 6;
const HOURS_END = 22;
const FORECAST_DAYS = 7;
// Écart rafale - vent moyen (nds) à partir duquel on signale un vent rafaleux.
const GUST_THRESHOLD_KN = 6;

const COL_W = 42;
// Hauteurs de ligne partagées entre la colonne des libellés et les cases.
const ROW = { header: 24, wind: 34, gust: 26, dir: 40, tide: 40 };
const LABEL_W = 70;

export const LEVEL_COLORS: Record<Level, string> = {
  bon: colors.status.good,
  moyen: colors.status.medium,
  mauvais: colors.status.bad,
};
const NEUTRAL_CELL = '#EDF1F4';

export const TIDE_LABELS: Record<string, string> = {
  toutes: 'Toutes marées',
  maree_haute: 'Marée haute',
  maree_basse: 'Marée basse',
  mi_maree_haute: 'Mi-marée à haute',
  mi_maree_basse: 'Mi-marée à basse',
  variable: 'Variable selon la zone',
  inconnue: 'Non documentée',
};

interface Day {
  dateIso: string;
  label: string;
  hours: HourCondition[];
  best: Level | null;
}

function dayLabel(date: Date, index: number): string {
  if (index === 0) return 'Auj.';
  if (index === 1) return 'Dem.';
  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()}`;
}

function bestLevel(hours: HourCondition[]): Level | null {
  if (hours.length === 0) return null;
  if (hours.some((h) => h.level === 'bon')) return 'bon';
  if (hours.some((h) => h.level === 'moyen')) return 'moyen';
  return 'mauvais';
}

interface Props {
  spot: Spot;
  initialDate?: string;
  // Créneau recherché (mis en évidence dans l'en-tête des heures).
  highlightStart?: number;
  highlightEnd?: number;
  onDayChange?: (dateIso: string) => void;
}

export default function ForecastTable({ spot, initialDate, highlightStart, highlightEnd, onDayChange }: Props) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate ?? localDateIso(new Date()));
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;
    const dates = Array.from({ length: FORECAST_DAYS }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
    // Une seule requête réseau (getWindForecast est mis en cache par spot),
    // découpée ensuite jour par jour.
    Promise.all(dates.map((d) => getHourlyConditions(spot, localDateIso(d))))
      .then((perDay) => {
        if (cancelled) return;
        setDays(
          perDay.map((list, i) => {
            const hours = list.filter((h) => h.hour >= HOURS_START && h.hour <= HOURS_END);
            return { dateIso: localDateIso(dates[i]), label: dayLabel(dates[i], i), hours, best: bestLevel(hours) };
          })
        );
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [spot.id]);

  const day = days?.find((d) => d.dateIso === selectedDate) ?? days?.[0] ?? null;
  const isSearchDay = initialDate != null && day?.dateIso === initialDate;

  // Place la colonne pertinente (début du créneau recherché, sinon heure
  // actuelle aujourd'hui, sinon 10h) près du bord gauche.
  useEffect(() => {
    if (!day) return;
    const isToday = day.dateIso === localDateIso(new Date());
    const target = isSearchDay && highlightStart != null ? highlightStart : isToday ? new Date().getHours() : 10;
    const index = Math.max(0, day.hours.findIndex((h) => h.hour >= target));
    const timer = setTimeout(() => scrollRef.current?.scrollTo({ x: Math.max(0, (index - 1) * COL_W), animated: false }), 0);
    return () => clearTimeout(timer);
  }, [day?.dateIso, days != null]);

  function selectDay(dateIso: string) {
    setSelectedDate(dateIso);
    onDayChange?.(dateIso);
  }

  const windMin = spot.ventMinNoeuds ?? DEFAULT_WIND_MIN_KN;
  const windMax = spot.ventMaxNoeuds ?? DEFAULT_WIND_MAX_KN;
  const hasDirections = (spot.directionsFavorables?.length ?? 0) > 0;
  // 'variable' / 'inconnue' (ou pas d'ancre de marée) : on ne sait pas
  // juger, la ligne marée reste neutre plutôt que faussement verte.
  const tideRated = spot.mareeRef != null && spot.contrainteMaree !== 'variable' && spot.contrainteMaree !== 'inconnue';

  return (
    <View>
      <View style={styles.idealTab}>
        <Ionicons name="star" size={11} color={colors.neutral.white} />
        <Text style={styles.idealTabText}>CONDITIONS PARFAITES</Text>
      </View>
      <View style={styles.idealPanel}>
        <IdealItem icon="speedometer-outline" label="Vent" value={`${windMin}–${windMax} nds`} />
        <IdealItem
          icon="compass-outline"
          label="Direction"
          value={hasDirections ? spot.directionsFavorables!.join(' · ') : 'Non documentée'}
        />
        <IdealItem icon="water-outline" label="Marée" value={TIDE_LABELS[spot.contrainteMaree]} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {(days ?? []).map((d) => {
          const active = d.dateIso === day?.dateIso;
          return (
            <Pressable key={d.dateIso} style={[styles.dayChip, active && styles.dayChipActive]} onPress={() => selectDay(d.dateIso)}>
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{d.label}</Text>
              <View style={[styles.dayDot, { backgroundColor: d.best ? LEVEL_COLORS[d.best] : NEUTRAL_CELL }]} />
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? (
        <Text style={styles.message}>Prévisions indisponibles pour le moment.</Text>
      ) : !day ? (
        <ActivityIndicator style={{ marginVertical: 30 }} color={colors.blue} />
      ) : day.hours.length === 0 ? (
        <Text style={styles.message}>Pas de prévision pour ce jour.</Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.labelColumn}>
            <RowLabel height={ROW.header} label="Heure" />
            <View style={[styles.globalRow]} />
            <RowLabel height={ROW.wind} label="Vent" unit="nds" />
            <RowLabel height={ROW.gust} label="Rafales" />
            <RowLabel height={ROW.dir} label="Direction" />
            <RowLabel height={ROW.tide} label="Marée" />
          </View>

          <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
            {day.hours.map((h) => {
              const highlighted = isSearchDay && highlightStart != null && highlightEnd != null
                && h.hour >= highlightStart && h.hour <= highlightEnd;
              const gusty = h.windGustKn - h.windSpeedKn >= GUST_THRESHOLD_KN;
              return (
                <View key={h.hour} style={styles.column}>
                  <View style={[styles.rowBox, { height: ROW.header }]}>
                    <Text style={[styles.hourText, highlighted && styles.hourTextHighlighted]}>{h.hourLabel}</Text>
                  </View>
                  <View style={[styles.globalRow, styles.globalCell, { backgroundColor: LEVEL_COLORS[h.level] }]} />

                  <View style={[styles.cell, { height: ROW.wind }, { backgroundColor: LEVEL_COLORS[h.windLevel] }]}>
                    <Text style={styles.cellValue}>{h.windSpeedKn}</Text>
                  </View>

                  <View style={[styles.cell, { height: ROW.gust }, { backgroundColor: NEUTRAL_CELL }]}>
                    <Text style={[styles.gustValue, gusty && styles.gustValueWarning]}>{h.windGustKn}</Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      { height: ROW.dir },
                      { backgroundColor: hasDirections ? LEVEL_COLORS[h.dirLevel] : NEUTRAL_CELL },
                    ]}
                  >
                    {/* Flèche orientée dans le sens où souffle le vent
                        (windDirDeg = direction d'où il vient). */}
                    <View style={{ transform: [{ rotate: `${h.windDirDeg}deg` }] }}>
                      <Ionicons name="arrow-down" size={15} color={hasDirections ? colors.neutral.white : colors.navyBase} />
                    </View>
                    <Text style={[styles.dirText, !hasDirections && styles.neutralText]}>{h.windDir}</Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      { height: ROW.tide },
                      { backgroundColor: tideRated ? LEVEL_COLORS[h.tideLevel] : NEUTRAL_CELL },
                    ]}
                  >
                    {h.tideHeightFraction == null ? (
                      <Text style={[styles.dirText, styles.neutralText]}>—</Text>
                    ) : (
                      <>
                        <View style={[styles.tideGauge, !tideRated && styles.tideGaugeNeutral]}>
                          <View
                            style={[
                              styles.tideGaugeFill,
                              !tideRated && styles.tideGaugeFillNeutral,
                              { height: `${Math.round(h.tideHeightFraction * 100)}%` },
                            ]}
                          />
                        </View>
                        <Ionicons
                          name={h.tideRising ? 'arrow-up' : 'arrow-down'}
                          size={10}
                          color={tideRated ? colors.neutral.white : colors.navyBase}
                        />
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.legend}>
        <LegendItem color={LEVEL_COLORS.bon} label="Idéal" />
        <LegendItem color={LEVEL_COLORS.moyen} label="Limite" />
        <LegendItem color={LEVEL_COLORS.mauvais} label="Non navigable" />
      </View>
    </View>
  );
}

function IdealItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.idealItem}>
      <View style={styles.idealItemHeader}>
        <Ionicons name={icon} size={12} color={colors.status.good} />
        <Text style={styles.idealItemLabel}>{label}</Text>
      </View>
      <Text style={styles.idealItemValue}>{value}</Text>
    </View>
  );
}

function RowLabel({ height, label, unit }: { height: number; label: string; unit?: string }) {
  return (
    <View style={[styles.rowBox, styles.rowLabelBox, { height }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {unit && <Text style={styles.unit}>{unit}</Text>}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  idealTab: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.status.good,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  idealTabText: { fontFamily: typography.h3.fontFamily, fontSize: 10, color: colors.neutral.white, letterSpacing: 0.8 },
  idealPanel: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#E8F6F0',
    borderWidth: 1,
    borderColor: '#BFE6D4',
    borderRadius: 10,
    borderTopLeftRadius: 0,
    padding: 10,
  },
  idealItem: { flex: 1, minWidth: 0 },
  idealItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  idealItemLabel: { ...typography.caption, fontSize: 9.5, color: colors.navy(0.5), letterSpacing: 0.4 },
  idealItemValue: { fontFamily: typography.h3.fontFamily, fontSize: 12.5, color: colors.navyBase, marginTop: 3 },

  dayRow: { gap: 6, paddingVertical: 12 },
  dayChip: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F0F4F7',
  },
  dayChipActive: { backgroundColor: colors.navyBase },
  dayChipText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.navy(0.7) },
  dayChipTextActive: { color: colors.neutral.white },
  dayDot: { width: 6, height: 6, borderRadius: 3 },

  message: { ...typography.body, color: colors.navy(0.5), textAlign: 'center', marginVertical: 24 },

  table: { flexDirection: 'row' },
  labelColumn: { width: LABEL_W, borderRightWidth: 1, borderRightColor: colors.navy(0.08) },
  rowBox: { justifyContent: 'center', marginBottom: 2 },
  rowLabelBox: { paddingRight: 6 },
  rowLabel: { fontFamily: typography.h3.fontFamily, fontSize: 11, color: colors.navy(0.65) },
  unit: { ...typography.body, fontSize: 9.5, color: colors.navy(0.4) },
  column: { width: COL_W, paddingHorizontal: 1 },
  globalRow: { height: 6, marginBottom: 4 },

  hourText: { ...typography.mono, fontSize: 10.5, color: colors.navy(0.55), textAlign: 'center' },
  hourTextHighlighted: { color: colors.blue, fontFamily: typography.h3.fontFamily },
  globalCell: { borderRadius: 2 },
  cell: { alignItems: 'center', justifyContent: 'center', marginBottom: 2, borderRadius: 4 },
  cellValue: { fontFamily: typography.h1.fontFamily, fontSize: 15, color: colors.neutral.white },
  gustValue: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.navy(0.7) },
  gustValueWarning: { color: colors.accentOrangeDark },
  dirText: { fontFamily: typography.h3.fontFamily, fontSize: 9, color: colors.neutral.white, marginTop: 1 },
  neutralText: { color: colors.navy(0.6) },

  tideGauge: {
    width: 11,
    height: 22,
    borderRadius: 3,
    backgroundColor: colors.white(0.35),
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  tideGaugeNeutral: { backgroundColor: colors.navy(0.12) },
  tideGaugeFill: { width: '100%', backgroundColor: colors.neutral.white },
  tideGaugeFillNeutral: { backgroundColor: colors.navy(0.5) },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { ...typography.caption, color: colors.navy(0.6) },
});
