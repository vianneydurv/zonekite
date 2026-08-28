import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

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

// Écran central : recherche de spot selon jour, créneau, point de départ, distance max
export default function SearchScreen() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const windowEnd = useMemo(() => addDays(today, FORECAST_WINDOW_DAYS - 1), [today]);

  const [selectedDate, setSelectedDate] = useState(today);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(18);
  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);

  const weeks = useMemo(() => {
    const dayOfWeek = today.getDay();
    const mondayOffset = (dayOfWeek + 6) % 7;
    const gridStart = addDays(today, -mondayOffset);
    const days = Array.from({ length: 21 }, (_, i) => addDays(gridStart, i));
    return [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21)];
  }, [today]);

  const isOutOfRange = selectedDate > windowEnd;

  const lastUpdatedLabel = useMemo(() => {
    const now = new Date();
    return `MAJ ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ZONEKITE</Text>
        <Text style={styles.headerMeta}>{lastUpdatedLabel}</Text>
      </View>

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
            <Text style={styles.fieldValue}>Paris 11e</Text>
          </View>
          <Pressable onPress={() => Alert.alert('Bientôt disponible', 'Le profil n’est pas encore construit.')}>
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

        <Pressable
          style={[styles.searchButton, isOutOfRange && styles.searchButtonDisabled]}
          disabled={isOutOfRange}
          onPress={() =>
            Alert.alert(
              'Bientôt disponible',
              'Le moteur de recherche vent/marée arrive dans une prochaine étape.'
            )
          }
        >
          <Text style={styles.searchButtonText}>CHERCHER</Text>
        </Pressable>

        <Pressable onPress={() => Alert.alert('Bientôt disponible', 'Pas encore de recherches enregistrées.')}>
          <Text style={styles.savedSearchesLink}>Mes recherches enregistrées</Text>
        </Pressable>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ocean[900] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTitle: { ...typography.h2, color: colors.neutral.white, letterSpacing: 1 },
  headerMeta: { ...typography.caption, color: colors.ocean[300] },
  card: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardContent: { padding: 20, paddingBottom: 40 },
  title: { ...typography.h2, color: colors.ocean[900] },
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
  calendarLabel: { ...typography.caption, color: colors.neutral.textSecondary, fontWeight: '600' },
  calendarMonth: { ...typography.bodyBold, color: colors.ocean[900] },
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
  dayCellInWindow: { backgroundColor: colors.ocean[100] },
  dayCellSelected: { backgroundColor: colors.ocean[900] },
  dayCellText: { ...typography.body, color: colors.neutral.textSecondary },
  dayCellTextInWindow: { color: colors.ocean[900], fontWeight: '600' },
  dayCellTextSelected: { color: colors.neutral.white, fontWeight: '700' },
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
    fontWeight: '600',
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
  fieldLabel: { ...typography.caption, color: colors.neutral.textSecondary, fontWeight: '600' },
  fieldValue: { ...typography.h3, color: colors.ocean[900] },
  fieldValuePlaceholder: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 4 },
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
  linkText: { ...typography.bodyBold, color: colors.ocean[700] },
  searchButton: {
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  searchButtonDisabled: { opacity: 0.5 },
  searchButtonText: { ...typography.bodyBold, color: colors.neutral.white, letterSpacing: 0.5 },
  savedSearchesLink: {
    ...typography.body,
    color: colors.ocean[700],
    textAlign: 'center',
    marginTop: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 47, 68, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: { ...typography.h3, color: colors.ocean[900], marginBottom: 12 },
  modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.neutral.border },
  modalOptionText: { ...typography.body, color: colors.ocean[900], textAlign: 'center' },
});
