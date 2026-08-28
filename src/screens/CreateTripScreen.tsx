import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarpoolStackParamList } from '../navigation/CarpoolStackNavigator';
import { colors, typography } from '../theme';
import { spots } from '../data/spots';
import { addTrip } from '../lib/tripsStorage';
import { getProfile } from '../lib/profileStorage';
import type { Trajet } from '../types/trajet';

type Props = NativeStackScreenProps<CarpoolStackParamList, 'CreateTrip'>;

const HOURS = Array.from({ length: 17 }, (_, i) => `${i + 6}h`);

function nextDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function CreateTripScreen({ navigation }: Props) {
  const days = useMemo(() => nextDays(14), []);

  const [spotId, setSpotId] = useState<string | null>(null);
  const [showSpotPicker, setShowSpotPicker] = useState(false);
  const [spotFilter, setSpotFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [heureDepart, setHeureDepart] = useState<string | null>(null);
  const [heureRetour, setHeureRetour] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<'depart' | 'retour' | null>(null);
  const [adresseDepart, setAdresseDepart] = useState('');
  const [places, setPlaces] = useState(1);

  const selectedSpot = spots.find((s) => s.id === spotId);
  const filteredSpots = spots.filter((s) =>
    s.nom.toLowerCase().includes(spotFilter.toLowerCase())
  );

  const canSubmit = spotId != null && heureDepart != null && adresseDepart.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit || !spotId || !heureDepart) return;
    const profile = await getProfile();
    const trip: Trajet = {
      id: `${Date.now()}`,
      spotId,
      conducteurPrenom: profile?.prenom ?? 'Moi',
      conducteurPhotoUri: profile?.photoUri,
      date: selectedDate.toISOString().slice(0, 10),
      heureDepart,
      heureRetourEstimee: heureRetour ?? undefined,
      adresseDepart: adresseDepart.trim(),
      placesDispo: places,
    };
    await addTrip(trip);
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.fieldLabel}>SPOT</Text>
      <Pressable style={styles.selectField} onPress={() => setShowSpotPicker(true)}>
        <Text style={selectedSpot ? styles.selectValue : styles.selectPlaceholder}>
          {selectedSpot ? selectedSpot.nom : 'Choisir un spot'}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.neutral.textSecondary} />
      </Pressable>

      <Text style={styles.fieldLabel}>JOUR</Text>
      <FlatList
        data={days}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(d) => d.toISOString()}
        renderItem={({ item }) => {
          const selected = item.toDateString() === selectedDate.toDateString();
          return (
            <Pressable
              style={[styles.dayChip, selected && styles.dayChipSelected]}
              onPress={() => setSelectedDate(item)}
            >
              <Text style={[styles.dayChipWeekday, selected && styles.dayChipTextSelected]}>
                {item.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </Text>
              <Text style={[styles.dayChipNumber, selected && styles.dayChipTextSelected]}>
                {item.getDate()}
              </Text>
            </Pressable>
          );
        }}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      />

      <Text style={styles.fieldLabel}>HORAIRES</Text>
      <View style={styles.hourRow}>
        <Pressable style={styles.hourField} onPress={() => setPickerMode('depart')}>
          <Text style={styles.hourFieldLabel}>DÉPART</Text>
          <Text style={heureDepart ? styles.selectValue : styles.selectPlaceholder}>
            {heureDepart ?? 'Choisir'}
          </Text>
        </Pressable>
        <Pressable style={styles.hourField} onPress={() => setPickerMode('retour')}>
          <Text style={styles.hourFieldLabel}>RETOUR ESTIMÉ</Text>
          <Text style={heureRetour ? styles.selectValue : styles.selectPlaceholder}>
            {heureRetour ?? 'Optionnel'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>POINT DE DÉPART</Text>
      <TextInput
        style={styles.input}
        value={adresseDepart}
        onChangeText={setAdresseDepart}
        placeholder="Ex : Paris 11e"
        placeholderTextColor={colors.neutral.textSecondary}
      />

      <Text style={styles.fieldLabel}>PLACES DISPONIBLES</Text>
      <View style={styles.stepperRow}>
        <Pressable
          style={styles.stepperButton}
          onPress={() => setPlaces((p) => Math.max(1, p - 1))}
        >
          <Ionicons name="remove" size={20} color={colors.ocean[900]} />
        </Pressable>
        <Text style={styles.stepperValue}>{places}</Text>
        <Pressable style={styles.stepperButton} onPress={() => setPlaces((p) => p + 1)}>
          <Ionicons name="add" size={20} color={colors.ocean[900]} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>PUBLIER LE TRAJET</Text>
      </Pressable>

      <Modal visible={showSpotPicker} animationType="slide">
        <View style={styles.pickerContainer}>
          <TextInput
            style={[styles.input, { margin: 16 }]}
            value={spotFilter}
            onChangeText={setSpotFilter}
            placeholder="Rechercher un spot"
            placeholderTextColor={colors.neutral.textSecondary}
            autoFocus
          />
          <FlatList
            data={filteredSpots}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.pickerRow}
                onPress={() => {
                  setSpotId(item.id);
                  setShowSpotPicker(false);
                  setSpotFilter('');
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
        </View>
      </Modal>

      <Modal visible={pickerMode !== null} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerMode(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {pickerMode === 'depart' ? 'Heure de départ' : 'Heure de retour estimée'}
            </Text>
            <FlatList
              data={HOURS}
              keyExtractor={(h) => h}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalOption}
                  onPress={() => {
                    if (pickerMode === 'depart') setHeureDepart(item);
                    else setHeureRetour(item);
                    setPickerMode(null);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  content: { padding: 20, paddingBottom: 60 },
  fieldLabel: {
    ...typography.caption,
    color: colors.neutral.textSecondary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  selectField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
  },
  selectValue: { ...typography.body, color: colors.ocean[900] },
  selectPlaceholder: { ...typography.body, color: colors.neutral.textSecondary },
  dayChip: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  dayChipSelected: { backgroundColor: colors.ocean[900], borderColor: colors.ocean[900] },
  dayChipWeekday: { ...typography.caption, color: colors.neutral.textSecondary },
  dayChipNumber: { ...typography.bodyBold, color: colors.ocean[900] },
  dayChipTextSelected: { color: colors.neutral.white },
  hourRow: { flexDirection: 'row', gap: 12 },
  hourField: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
  },
  hourFieldLabel: { ...typography.caption, color: colors.neutral.textSecondary, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
    ...typography.body,
    color: colors.ocean[900],
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { ...typography.h3, color: colors.ocean[900] },
  submitButton: {
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { ...typography.bodyBold, color: colors.neutral.white, letterSpacing: 0.5 },
  pickerContainer: { flex: 1, backgroundColor: colors.neutral.background, paddingTop: 60 },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(6, 47, 68, 0.4)', justifyContent: 'flex-end' },
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
