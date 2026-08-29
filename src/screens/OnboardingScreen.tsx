import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { saveProfile } from '../lib/profileStorage';
import MaterielSection from '../components/MaterielSection';
import {
  NIVEAU_LABELS,
  type Aile,
  type AutreMateriel,
  type Board,
  type NiveauKite,
  type Profile,
} from '../types/profile';

const NIVEAUX: NiveauKite[] = ['debutant', 'intermediaire', 'confirme', 'expert'];

export default function OnboardingScreen({ onComplete }: { onComplete: (profile: Profile) => void }) {
  const [prenom, setPrenom] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [niveau, setNiveau] = useState<NiveauKite | null>(null);
  const [ville, setVille] = useState('');
  const [ailes, setAiles] = useState<Aile[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [autres, setAutres] = useState<AutreMateriel[]>([]);

  const canSubmit =
    prenom.trim().length > 0 && photoUri != null && niveau != null && ville.trim().length > 0;

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo requise',
        'Autorisez l\'accès à vos photos dans les réglages pour choisir une photo de profil.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!canSubmit || !photoUri || !niveau) return;
    const profile: Profile = {
      prenom: prenom.trim(),
      photoUri,
      niveau,
      ville: ville.trim(),
      materiel: {
        ailes: ailes.filter((a) => a.marque.trim() || a.modele.trim() || a.taille.trim()),
        boards: boards.filter((b) => b.marque.trim() || b.modele.trim()),
        autres: autres.filter((a) => a.nom.trim()),
      },
    };
    await saveProfile(profile);
    onComplete(profile);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ZONEKITE</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
          <Text style={styles.title}>Bienvenue dans la communauté</Text>
          <Text style={styles.subtitle}>
            Un profil complet instaure la confiance avec les autres membres, notamment pour le
            covoiturage.
          </Text>

          <Pressable style={styles.photoPicker} onPress={pickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={26} color={colors.ocean[300]} />
              </View>
            )}
            <Text style={styles.photoLabel}>
              {photoUri ? 'Changer la photo' : 'Ajouter une photo *'}
            </Text>
          </Pressable>

          <Text style={styles.fieldLabel}>PRÉNOM *</Text>
          <TextInput
            style={styles.input}
            value={prenom}
            onChangeText={setPrenom}
            placeholder="Ton prénom"
            placeholderTextColor={colors.neutral.textSecondary}
          />

          <Text style={styles.fieldLabel}>NIVEAU DE PRATIQUE *</Text>
          <View style={styles.niveauRow}>
            {NIVEAUX.map((n) => (
              <Pressable
                key={n}
                style={[styles.niveauChip, niveau === n && styles.niveauChipSelected]}
                onPress={() => setNiveau(n)}
              >
                <Text style={[styles.niveauChipText, niveau === n && styles.niveauChipTextSelected]}>
                  {NIVEAU_LABELS[n]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>VILLE *</Text>
          <TextInput
            style={styles.input}
            value={ville}
            onChangeText={setVille}
            placeholder="Ta ville"
            placeholderTextColor={colors.neutral.textSecondary}
          />

          <MaterielSection<Aile>
            title="AILES · OPTIONNEL"
            addLabel="+ Ajouter une aile"
            items={ailes}
            onChange={setAiles}
            emptyItem={{ marque: '', modele: '', taille: '' }}
            fields={[
              { key: 'marque', placeholder: 'Marque' },
              { key: 'modele', placeholder: 'Modèle' },
              { key: 'taille', placeholder: 'Taille' },
            ]}
          />

          <MaterielSection<Board>
            title="BOARD · OPTIONNEL"
            addLabel="+ Ajouter une board"
            items={boards}
            onChange={setBoards}
            emptyItem={{ marque: '', modele: '' }}
            fields={[
              { key: 'marque', placeholder: 'Marque' },
              { key: 'modele', placeholder: 'Modèle' },
            ]}
          />

          <MaterielSection<AutreMateriel>
            title="AUTRES · OPTIONNEL"
            addLabel="+ Ajouter un équipement"
            items={autres}
            onChange={setAutres}
            emptyItem={{ nom: '' }}
            fields={[{ key: 'nom', placeholder: 'Ex : harnais, casque...' }]}
          />

          <Pressable
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>COMMENCER</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ocean[900] },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  headerTitle: { ...typography.h2, color: colors.neutral.white, letterSpacing: 1 },
  card: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardContent: { padding: 20, paddingBottom: 40 },
  title: { ...typography.h2, color: colors.ocean[900] },
  subtitle: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 6, marginBottom: 24 },
  photoPicker: { alignItems: 'center', marginBottom: 24 },
  photo: { width: 88, height: 88, borderRadius: 44 },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: { ...typography.caption, color: colors.ocean[700], fontWeight: '600', marginTop: 8 },
  fieldLabel: {
    ...typography.caption,
    color: colors.neutral.textSecondary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
    ...typography.body,
    color: colors.ocean[900],
  },
  niveauRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  niveauChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  niveauChipSelected: { backgroundColor: colors.ocean[900], borderColor: colors.ocean[900] },
  niveauChipText: { ...typography.caption, color: colors.ocean[900], fontWeight: '600' },
  niveauChipTextSelected: { color: colors.neutral.white },
  submitButton: {
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { ...typography.bodyBold, color: colors.neutral.white, letterSpacing: 0.5 },
});
