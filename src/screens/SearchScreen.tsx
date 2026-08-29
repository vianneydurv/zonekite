import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, typography } from '../theme';
import { getProfile } from '../lib/profileStorage';
import { getTrips } from '../lib/tripsStorage';
import { getSpotCondition, localDateIso, type SpotCondition } from '../lib/matching';
import { spots } from '../data/spots';
import type { Spot } from '../types/spot';

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_LABELS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];
const FORECAST_WINDOW_DAYS = 7;
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06h .. 22h

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function monthRangeLabel(start: Date, end: Date) {
  const startLabel = MONTH_LABELS[start.getMonth()];
  const endLabel = MONTH_LABELS[end.getMonth()];
  if (start.getMonth() === end.getMonth()) {
    return `${capitalize(startLabel)} ${start.getFullYear()}`;
  }
  return `${capitalize(startLabel)} – ${endLabel} ${end.getFullYear()}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dayShortLabel(date: Date) {
  return capitalize(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })).replace('.', '.');
}

const VERDICT_ORDER: Record<string, number> = {
  'BONNES CONDITIONS': 0,
  'CONDITIONS MOYENNES': 1,
  'NON NAVIGABLE': 2,
};

// Écran central : recherche de spot selon jour, créneau, point de départ, distance max
export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const today = useMemo(() => startOfDay(new Date()), []);
  const windowEnd = useMemo(() => addDays(today, FORECAST_WINDOW_DAYS - 1), [today]);

  const [selectedDate, setSelectedDate] = useState(today);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(18);
  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);
  const [adresseDepart, setAdresseDepart] = useState('');
  const [departDraft, setDepartDraft] = useState('');
  const [showDepartEditor, setShowDepartEditor] = useState(false);
  const [searched, setSearched] = useState(false);
  const [carpoolCounts, setCarpoolCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getProfile().then((profile) => {
      if (profile?.ville) setAdresseDepart(profile.ville);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getTrips().then((trips) => {
        const counts: Record<string, number> = {};
        trips.forEach((t) => {
          counts[t.spotId] = (counts[t.spotId] ?? 0) + 1;
        });
        setCarpoolCounts(counts);
      });
    }, [])
  );

  const weeks = useMemo(() => {
    const dayOfWeek = today.getDay();
    const mondayOffset = (dayOfWeek + 6) % 7;
    const gridStart = addDays(today, -mondayOffset);
    const days = Array.from({ length: 21 }, (_, i) => addDays(gridStart, i));
    return [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21)];
  }, [today]);

  const isOutOfRange = selectedDate > windowEnd;

  const dateIso = localDateIso(selectedDate);

  const [results, setResults] = useState<{ spot: Spot; condition: SpotCondition }[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (!searched) return;
    let cancelled = false;
    setLoadingResults(true);
    Promise.all(spots.map((spot) => getSpotCondition(spot, dateIso).then((condition) => ({ spot, condition })))).then(
      (list) => {
        if (cancelled) return;
        list.sort((a, b) => VERDICT_ORDER[a.condition.verdict] - VERDICT_ORDER[b.condition.verdict]);
        setResults(list);
        setLoadingResults(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [dateIso, searched]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>ZONEKITE</Text>
          {!searched && <Text style={styles.headerMeta}>MAJ {String(new Date().getHours()).padStart(2, '0')}:{String(new Date().getMinutes()).padStart(2, '0')}</Text>}
        </View>

        {searched && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryLabel}>JOUR · 7 J MAX</Text>
              <Text style={styles.summaryValue}>{dayShortLabel(selectedDate)}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryLabel}>CRÉNEAU</Text>
              <Text style={styles.summaryValue}>{startHour}h–{endHour}h</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryLabel}>DÉPART</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{adresseDepart || '—'}</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setSearched(false)}>
              <Ionicons name="pencil" size={16} color={colors.neutral.white} />
            </Pressable>
          </View>
        )}
      </View>

      {!searched ? (
        <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
          <Text style={styles.title}>Où et quand tu navigues ?</Text>
          <Text style={styles.subtitle}>
            Renseigne le jour et le créneau. Le point de départ vient de ton profil, tu peux le
            changer.
          </Text>

          <View style={styles.calendarBox}>
            <View style={styles.calendarHeaderRow}>
              <Text style={styles.calendarLabel}>JOUR · {FORECAST_WINDOW_DAYS} JOURS MAX</Text>
              <Text style={styles.calendarMonth}>{monthRangeLabel(today, windowEnd)}</Text>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, i) => (
                <Text key={i} style={styles.weekdayLabel}>{label}</Text>
              ))}
            </View>

            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((date) => {
                  const inWindow = date >= today && date <= windowEnd;
                  const selected = isSameDay(date, selectedDate);
                  return (
                    <Pressable
                      key={date.toISOString()}
                      style={[
                        styles.dayCell,
                        inWindow && styles.dayCellInWindow,
                        selected && styles.dayCellSelected,
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          inWindow && styles.dayCellTextInWindow,
                          selected && styles.dayCellTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <Text style={styles.calendarHelper}>
              Les jours en bleu sont dans la fenêtre de prévision.
            </Text>
          </View>

          {isOutOfRange && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>
                Date hors portée · {FORECAST_WINDOW_DAYS} jours max
              </Text>
              <Text style={styles.warningBody}>
                Au-delà de {FORECAST_WINDOW_DAYS} jours les modèles divergent trop pour trancher.
                Choisis une date plus proche.
              </Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>PLAGE HORAIRE</Text>
          <View style={styles.hourRow}>
            <Pressable style={styles.hourField} onPress={() => setPickerMode('start')}>
              <Text style={styles.fieldLabel}>DÉBUT</Text>
              <View style={styles.hourValueRow}>
                <Text style={styles.fieldValue}>{startHour}h</Text>
                <Ionicons name="chevron-down" size={16} color={colors.neutral.textSecondary} />
              </View>
            </Pressable>
            <Pressable style={styles.hourField} onPress={() => setPickerMode('end')}>
              <Text style={styles.fieldLabel}>FIN</Text>
              <View style={styles.hourValueRow}>
                <Text style={styles.fieldValue}>{endHour}h</Text>
                <Ionicons name="chevron-down" size={16} color={colors.neutral.textSecondary} />
              </View>
            </Pressable>
          </View>

          <View style={styles.listItem}>
            <View>
              <Text style={styles.fieldLabel}>DÉPART · DEPUIS TON PROFIL</Text>
              <Text style={styles.fieldValue}>{adresseDepart || '—'}</Text>
            </View>
            <Pressable
              onPress={() => {
                setDepartDraft(adresseDepart);
                setShowDepartEditor(true);
              }}
            >
              <Text style={styles.linkText}>Changer</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.listItem}
            onPress={() => Alert.alert('Bientôt disponible', 'Le filtre de distance arrive dans une prochaine étape.')}
          >
            <View>
              <Text style={styles.fieldLabel}>DISTANCE MAX · OPTIONNEL</Text>
              <Text style={styles.fieldValuePlaceholder}>Sans limite</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.neutral.textSecondary} />
          </Pressable>

          <Pressable style={[styles.searchButton, isOutOfRange && styles.searchButtonDisabled]} disabled={isOutOfRange} onPress={() => setSearched(true)}>
            <Text style={styles.searchButtonText}>CHERCHER</Text>
          </Pressable>

          <Pressable onPress={() => Alert.alert('Bientôt disponible', 'Pas encore de recherches enregistrées.')}>
            <Text style={styles.savedSearchesLink}>Mes recherches enregistrées</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.resultsContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderLabel}>carte des spots</Text>
          </View>

          <FlatList
            data={results}
            keyExtractor={({ spot }) => spot.id}
            contentContainerStyle={styles.resultsList}
            ListHeaderComponent={
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.resultsCount}>
                  {loadingResults
                    ? 'RÉCUPÉRATION DES CONDITIONS…'
                    : `${results.length} SPOTS · MEILLEURES CONDITIONS D'ABORD`}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ResultCard
                spot={item.spot}
                verdict={item.condition.verdict}
                color={item.condition.color}
                window={item.condition.window}
                windSpeed={item.condition.windSpeed}
                windDir={item.condition.windDir}
                tideLabel={item.condition.tideLabel}
                carpoolCount={carpoolCounts[item.spot.id] ?? 0}
                onPress={() => navigation.navigate('SpotDetail', { spot: item.spot })}
                onCarpoolPress={() => navigation.getParent()?.navigate('Carpool')}
              />
            )}
          />
        </View>
      )}

      <Modal visible={pickerMode !== null} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerMode(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {pickerMode === 'start' ? 'Heure de début' : 'Heure de fin'}
            </Text>
            <FlatList
              data={HOURS.filter((h) =>
                pickerMode === 'start' ? h < endHour : h > startHour
              )}
              keyExtractor={(h) => String(h)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalOption}
                  onPress={() => {
                    if (pickerMode === 'start') setStartHour(item);
                    else setEndHour(item);
                    setPickerMode(null);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}h</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showDepartEditor} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Point de départ</Text>
            <TextInput
              style={styles.departInput}
              value={departDraft}
              onChangeText={setDepartDraft}
              placeholder="Ville ou adresse de départ"
              placeholderTextColor={colors.neutral.textSecondary}
              autoFocus
            />
            <Pressable
              style={styles.departConfirmButton}
              onPress={() => {
                setAdresseDepart(departDraft.trim() || adresseDepart);
                setShowDepartEditor(false);
              }}
            >
              <Text style={styles.departConfirmText}>VALIDER</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function ResultCard({
  spot,
  verdict,
  color,
  window,
  windSpeed,
  windDir,
  tideLabel,
  carpoolCount,
  onPress,
  onCarpoolPress,
}: {
  spot: Spot;
  verdict: string;
  color: string;
  window: string;
  windSpeed: number;
  windDir: string;
  tideLabel: string;
  carpoolCount: number;
  onPress: () => void;
  onCarpoolPress: () => void;
}) {
  return (
    <Pressable style={resultStyles.card} onPress={onPress}>
      <View style={[resultStyles.banner, { backgroundColor: color }]}>
        <Text style={resultStyles.bannerVerdict}>{verdict}</Text>
        <Text style={resultStyles.bannerWindow}>{window}</Text>
      </View>
      <View style={resultStyles.body}>
        <View style={resultStyles.bodyTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={resultStyles.name}>{spot.nom}</Text>
            <Text style={resultStyles.sub}>{spot.region}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={resultStyles.wind}>{windSpeed}</Text>
            <Text style={resultStyles.windDir}>NŒUDS {windDir}</Text>
          </View>
        </View>
        <View style={resultStyles.factRow}>
          <View style={{ flex: 1 }}>
            <Text style={resultStyles.factLabel}>MARÉE</Text>
            <Text style={resultStyles.factValue}>{tideLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={resultStyles.factLabel}>NIVEAU</Text>
            <Text style={resultStyles.factValue} numberOfLines={1}>{spot.niveauIndicatif ?? '—'}</Text>
          </View>
        </View>
      </View>
      {carpoolCount > 0 && (
        <Pressable style={resultStyles.carpoolBanner} onPress={onCarpoolPress}>
          <Text style={resultStyles.carpoolText}>
            {carpoolCount} covoit{carpoolCount > 1 ? 's' : ''} · voir
          </Text>
          <Text style={resultStyles.carpoolText}>Voir ›</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const resultStyles = StyleSheet.create({
  card: { backgroundColor: colors.neutral.white, borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  banner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8 },
  bannerVerdict: { fontFamily: typography.h3.fontFamily, fontSize: 11, color: colors.neutral.white, letterSpacing: 1.1 },
  bannerWindow: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.neutral.white },
  body: { padding: 13 },
  bodyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontFamily: typography.h1.fontFamily, fontSize: 19, color: colors.navyBase },
  sub: { ...typography.body, color: colors.navy(0.5), marginTop: 3 },
  wind: { fontFamily: typography.h1.fontFamily, fontSize: 25, color: colors.navyBase },
  windDir: { ...typography.caption, color: colors.navy(0.5) },
  factRow: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: colors.navy(0.08), paddingTop: 10, gap: 8 },
  factLabel: { ...typography.caption, color: colors.navy(0.45) },
  factValue: { fontFamily: typography.h3.fontFamily, fontSize: 12.5, color: colors.navyBase, marginTop: 2 },
  carpoolBanner: { backgroundColor: colors.accent[100], paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', justifyContent: 'space-between' },
  carpoolText: { fontFamily: typography.h3.fontFamily, fontSize: 11.5, color: colors.accent[700] },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ocean[900] },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 15,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  headerTitle: { ...typography.h2, color: colors.neutral.white, letterSpacing: 1 },
  headerMeta: { ...typography.mono, color: colors.white(0.55) },
  summaryRow: { flexDirection: 'row', gap: 7, marginTop: 13 },
  summaryPill: { flex: 1, backgroundColor: colors.white(0.1), borderRadius: 10, padding: 8 },
  summaryLabel: { fontFamily: typography.h3.fontFamily, fontSize: 8.5, color: colors.white(0.5), letterSpacing: 0.9 },
  summaryValue: { fontFamily: typography.h3.fontFamily, fontSize: 13, color: colors.neutral.white, marginTop: 2 },
  editButton: { width: 42, backgroundColor: colors.accent[500], borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  card: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardContent: { padding: 20, paddingBottom: 40 },
  title: { ...typography.h2, color: colors.navyBase },
  subtitle: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 6, marginBottom: 20 },
  calendarBox: {
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 16,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarLabel: { ...typography.caption, color: colors.neutral.textSecondary },
  calendarMonth: { ...typography.bodyBold, color: colors.navyBase },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.neutral.textSecondary,
  },
  weekRow: { flexDirection: 'row', marginTop: 4 },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInWindow: { backgroundColor: colors.ocean[50] },
  dayCellSelected: { backgroundColor: colors.navyBase },
  dayCellText: { ...typography.body, color: colors.neutral.textSecondary },
  dayCellTextInWindow: { color: colors.blue, fontFamily: typography.h3.fontFamily },
  dayCellTextSelected: { color: colors.neutral.white, fontFamily: typography.h3.fontFamily },
  calendarHelper: { ...typography.caption, color: colors.neutral.textSecondary, marginTop: 12 },
  warningBox: {
    backgroundColor: colors.accent[100],
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  warningTitle: { ...typography.bodyBold, color: colors.accent[700], marginBottom: 4 },
  warningBody: { ...typography.caption, color: colors.accent[700] },
  sectionLabel: {
    ...typography.caption,
    color: colors.neutral.textSecondary,
    marginTop: 20,
    marginBottom: 8,
  },
  hourRow: { flexDirection: 'row', gap: 12 },
  hourField: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
  },
  hourValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  fieldLabel: { ...typography.caption, color: colors.neutral.textSecondary },
  fieldValue: { fontFamily: typography.h3.fontFamily, fontSize: 17, color: colors.navyBase },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 14,
    marginTop: 12,
  },
  linkText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.blue },
  fieldValuePlaceholder: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 4 },
  savedSearchesLink: { ...typography.body, color: colors.blue, textAlign: 'center', marginTop: 16, fontFamily: typography.h3.fontFamily },
  searchButton: {
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  searchButtonDisabled: { opacity: 0.5 },
  searchButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.neutral.white, letterSpacing: 0.5 },
  resultsContainer: { flex: 1 },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#D4E1E9',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 10,
  },
  mapPlaceholderLabel: {
    ...typography.mono,
    color: colors.navy(0.65),
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resultsList: { padding: 14, paddingBottom: 30 },
  resultsHeaderRow: { marginBottom: 10 },
  resultsCount: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.navy(0.55), letterSpacing: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 46, 69, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: { ...typography.h3, color: colors.navyBase, marginBottom: 12 },
  modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.neutral.border },
  modalOptionText: { ...typography.body, color: colors.navyBase, textAlign: 'center' },
  departInput: {
    backgroundColor: colors.neutral.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
    ...typography.body,
    color: colors.navyBase,
    marginBottom: 16,
  },
  departConfirmButton: {
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  departConfirmText: { fontFamily: typography.h3.fontFamily, fontSize: 13, color: colors.neutral.white, letterSpacing: 0.5 },
});
