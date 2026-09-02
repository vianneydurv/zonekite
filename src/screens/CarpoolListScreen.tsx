import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarpoolStackParamList } from '../navigation/CarpoolStackNavigator';
import { colors, typography } from '../theme';
import { getTrips } from '../lib/tripsStorage';
import { getProfile } from '../lib/profileStorage';
import { localDateIso } from '../lib/matching';
import { spots } from '../data/spots';
import type { Trajet } from '../types/trajet';
import TripCard from '../components/TripCard';

type Props = NativeStackScreenProps<CarpoolStackParamList, 'CarpoolList'>;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function nextDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function dayChipLabel(d: Date) {
  return capitalize(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }));
}

// Covoiturage : liste des trajets proposés, création de trajet
export default function CarpoolListScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<Trajet[]>([]);
  const [prenom, setPrenom] = useState<string | null>(null);
  const [mode, setMode] = useState<'seeking' | 'offering'>('seeking');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSpotPicker, setShowSpotPicker] = useState(false);
  const [spotFilterText, setSpotFilterText] = useState('');

  useFocusEffect(
    useCallback(() => {
      getTrips().then(setTrips);
      getProfile().then((p) => setPrenom(p?.prenom ?? null));
    }, [])
  );

  const days = useMemo(() => nextDays(14), []);
  const todayIso = localDateIso(new Date());
  const selectedDateIso = selectedDate ? localDateIso(selectedDate) : null;
  const selectedSpot = spots.find((s) => s.id === selectedSpotId);
  const filteredSpots = spots.filter((s) => s.nom.toLowerCase().includes(spotFilterText.toLowerCase()));

  const visibleTrips = trips
    .filter((t) => t.date >= todayIso)
    .filter((t) => (selectedDateIso ? t.date === selectedDateIso : true))
    .filter((t) => (selectedSpotId ? t.spotId === selectedSpotId : true))
    .filter((t) => (mode === 'offering' ? t.conducteurPrenom === prenom : t.conducteurPrenom !== prenom));

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
          <Pressable
            style={selectedDate ? styles.chipActive : styles.chip}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={selectedDate ? styles.chipActiveText : styles.chipText}>
              {(selectedDate ? dayChipLabel(selectedDate) : 'TOUS LES JOURS').toUpperCase()}
            </Text>
          </Pressable>
          <Pressable
            style={selectedSpotId ? styles.chipActive : styles.chip}
            onPress={() => setShowSpotPicker(true)}
          >
            <Text style={selectedSpotId ? styles.chipActiveText : styles.chipText} numberOfLines={1}>
              {(selectedSpot ? selectedSpot.nom : 'TOUS LES SPOTS').toUpperCase()}
            </Text>
          </Pressable>
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

      <Modal visible={showDatePicker} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Date du covoit</Text>
            <FlatList
              data={days}
              keyExtractor={(d) => d.toISOString()}
              ListHeaderComponent={
                <Pressable
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedDate(null);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>Tous les jours</Text>
                </Pressable>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedDate(item);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{dayChipLabel(item)}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showSpotPicker} animationType="slide">
        <SafeAreaView style={styles.pickerContainer}>
          <TextInput
            style={styles.pickerSearchInput}
            value={spotFilterText}
            onChangeText={setSpotFilterText}
            placeholder="Rechercher un spot"
            placeholderTextColor={colors.neutral.textSecondary}
            autoFocus
          />
          <FlatList
            data={filteredSpots}
            keyExtractor={(s) => s.id}
            ListHeaderComponent={
              <Pressable
                style={styles.pickerRow}
                onPress={() => {
                  setSelectedSpotId(null);
                  setShowSpotPicker(false);
                  setSpotFilterText('');
                }}
              >
                <Text style={styles.pickerRowText}>Tous les spots</Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.pickerRow}
                onPress={() => {
                  setSelectedSpotId(item.id);
                  setShowSpotPicker(false);
                  setSpotFilterText('');
                }}
              >
                <Text style={styles.pickerRowText}>{item.nom}</Text>
                <Text style={styles.pickerRowRegion}>{item.region}</Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.pickerClose} onPress={() => setShowSpotPicker(false)}>
            <Text style={styles.pickerCloseText}>Annuler</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
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
  chipActive: { flexShrink: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.accent[500] },
  chipActiveText: { fontFamily: typography.h3.fontFamily, fontSize: 11, color: colors.neutral.white },
  chip: { flexShrink: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.white(0.1) },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(6, 47, 68, 0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '65%',
  },
  modalTitle: { ...typography.h3, color: colors.ocean[900], marginBottom: 12 },
  modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.neutral.border },
  modalOptionText: { ...typography.body, color: colors.ocean[900] },
  pickerContainer: { flex: 1, backgroundColor: colors.neutral.background },
  pickerSearchInput: {
    margin: 16,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
    ...typography.body,
    color: colors.ocean[900],
  },
  pickerRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerRowText: { ...typography.body, color: colors.ocean[900] },
  pickerRowRegion: { ...typography.caption, color: colors.neutral.textSecondary },
  pickerClose: { padding: 20, alignItems: 'center' },
  pickerCloseText: { ...typography.bodyBold, color: colors.ocean[700] },
});
