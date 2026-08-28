import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ForumStackParamList } from '../navigation/ForumStackNavigator';
import { colors, typography } from '../theme';
import { addPost } from '../lib/forumStorage';
import { getProfile } from '../lib/profileStorage';
import type { ForumPost, ForumTag } from '../types/forum';

type Props = NativeStackScreenProps<ForumStackParamList, 'CreatePost'>;

const TAGS: ForumTag[] = ['SESSIONS', 'MATÉRIEL', 'SPOTS'];

export default function CreatePostScreen({ navigation }: Props) {
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [tag, setTag] = useState<ForumTag>('SESSIONS');

  const canSubmit = titre.trim().length > 0 && contenu.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    const profile = await getProfile();
    const post: ForumPost = {
      id: `${Date.now()}`,
      auteurPrenom: profile?.prenom ?? 'Moi',
      auteurPhotoUri: profile?.photoUri,
      titre: titre.trim(),
      contenu: contenu.trim(),
      date: new Date().toISOString(),
      tag,
      commentaires: [],
    };
    await addPost(post);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.fieldLabel}>CATÉGORIE</Text>
      <View style={styles.tagRow}>
        {TAGS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tagChip, tag === t && styles.tagChipSelected]}
            onPress={() => setTag(t)}
          >
            <Text style={[styles.tagChipText, tag === t && styles.tagChipTextSelected]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>TITRE</Text>
      <TextInput
        style={styles.input}
        value={titre}
        onChangeText={setTitre}
        placeholder="De quoi veux-tu parler ?"
        placeholderTextColor={colors.neutral.textSecondary}
      />

      <Text style={styles.fieldLabel}>MESSAGE</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={contenu}
        onChangeText={setContenu}
        placeholder="Ton message..."
        placeholderTextColor={colors.neutral.textSecondary}
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>PUBLIER</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background, padding: 20 },
  fieldLabel: {
    ...typography.caption,
    color: colors.neutral.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  tagRow: { flexDirection: 'row', gap: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  tagChipSelected: { backgroundColor: colors.navyBase, borderColor: colors.navyBase },
  tagChipText: { fontFamily: typography.h3.fontFamily, fontSize: 11, color: colors.navyBase },
  tagChipTextSelected: { color: colors.neutral.white },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
    ...typography.body,
    color: colors.navyBase,
  },
  textArea: { minHeight: 140 },
  submitButton: {
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 13, color: colors.neutral.white, letterSpacing: 0.5 },
});
