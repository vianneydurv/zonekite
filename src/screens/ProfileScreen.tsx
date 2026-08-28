import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';
import { getProfile } from '../lib/profileStorage';
import { NIVEAU_LABELS, type Profile } from '../types/profile';

// Profil utilisateur : prénom, photo, niveau, ville, matériel
export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  if (!profile) return null;

  // Garde-fou : un profil enregistré avant la restructuration du matériel
  // (ailes/board/autres) n'a pas encore cette forme.
  const ailes = profile.materiel?.ailes ?? [];
  const boards = profile.materiel?.boards ?? [];
  const autres = profile.materiel?.autres ?? [];
  const hasMateriel = ailes.length > 0 || boards.length > 0 || autres.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Image source={{ uri: profile.photoUri }} style={styles.photo} />
        <View style={styles.headerText}>
          <Text style={styles.prenom}>{profile.prenom}</Text>
          {profile.ville && <Text style={styles.ville}>{profile.ville}</Text>}
        </View>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{NIVEAU_LABELS[profile.niveau]}</Text>
      </View>

      <Text style={styles.sectionTitle}>Matériel</Text>
      {!hasMateriel && <Text style={styles.emptyText}>Aucun matériel renseigné</Text>}

      {ailes.length > 0 && (
        <>
          <Text style={styles.subLabel}>AILES</Text>
          {ailes.map((item, i) => (
            <View key={i} style={styles.materielRow}>
              <Text style={styles.materielType}>{[item.marque, item.modele].filter(Boolean).join(' ') || 'Aile'}</Text>
              {item.taille ? <Text style={styles.materielMeta}>{item.taille}</Text> : null}
            </View>
          ))}
        </>
      )}

      {boards.length > 0 && (
        <>
          <Text style={styles.subLabel}>BOARD</Text>
          {boards.map((item, i) => (
            <View key={i} style={styles.materielRow}>
              <Text style={styles.materielType}>{[item.marque, item.modele].filter(Boolean).join(' ') || 'Board'}</Text>
            </View>
          ))}
        </>
      )}

      {autres.length > 0 && (
        <>
          <Text style={styles.subLabel}>AUTRES</Text>
          {autres.map((item, i) => (
            <View key={i} style={styles.materielRow}>
              <Text style={styles.materielType}>{item.nom}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  content: { padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  photo: { width: 72, height: 72, borderRadius: 36 },
  headerText: { flex: 1 },
  prenom: { ...typography.h1, color: colors.ocean[900] },
  ville: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 2 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ocean[50],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 28,
  },
  badgeText: { ...typography.caption, color: colors.ocean[700], fontWeight: '600' },
  sectionTitle: { ...typography.h3, color: colors.ocean[900], marginBottom: 8 },
  emptyText: { ...typography.body, color: colors.neutral.textSecondary },
  subLabel: {
    ...typography.caption,
    color: colors.neutral.textSecondary,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  materielRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 14,
    marginBottom: 8,
  },
  materielType: { ...typography.bodyBold, color: colors.ocean[900] },
  materielMeta: { ...typography.body, color: colors.neutral.textSecondary },
});
