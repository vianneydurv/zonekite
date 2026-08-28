import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ForumStackParamList } from '../navigation/ForumStackNavigator';
import { colors, typography } from '../theme';
import { addComment, getPosts } from '../lib/forumStorage';
import { getProfile } from '../lib/profileStorage';
import type { ForumComment, ForumPost } from '../types/forum';

type Props = NativeStackScreenProps<ForumStackParamList, 'PostDetail'>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PostDetailScreen({ route }: Props) {
  const { postId } = route.params;
  const [post, setPost] = useState<ForumPost | null>(null);
  const [draft, setDraft] = useState('');

  useFocusEffect(
    useCallback(() => {
      getPosts().then((posts) => setPost(posts.find((p) => p.id === postId) ?? null));
    }, [postId])
  );

  async function handleSend() {
    if (!draft.trim() || !post) return;
    const profile = await getProfile();
    const comment: ForumComment = {
      id: `${Date.now()}`,
      auteurPrenom: profile?.prenom ?? 'Moi',
      auteurPhotoUri: profile?.photoUri,
      contenu: draft.trim(),
      date: new Date().toISOString(),
    };
    const updated = await addComment(post.id, comment);
    setPost(updated.find((p) => p.id === postId) ?? null);
    setDraft('');
  }

  if (!post) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={post.commentaires}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.postBlock}>
            <Text style={styles.titre}>{post.titre}</Text>
            <Text style={styles.meta}>{post.auteurPrenom} · {formatDate(post.date)}</Text>
            <Text style={styles.contenu}>{post.contenu}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            {item.auteurPhotoUri ? (
              <Image source={{ uri: item.auteurPhotoUri }} style={styles.commentPhoto} />
            ) : (
              <View style={styles.commentPhotoPlaceholder}>
                <Ionicons name="person" size={14} color={colors.ocean[300]} />
              </View>
            )}
            <View style={styles.commentBubble}>
              <Text style={styles.commentAuthor}>{item.auteurPrenom} · {formatDate(item.date)}</Text>
              <Text style={styles.commentText}>{item.contenu}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Écrire un commentaire..."
          placeholderTextColor={colors.neutral.textSecondary}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend} disabled={!draft.trim()}>
          <Ionicons name="send" size={18} color={colors.neutral.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  listContent: { padding: 20, paddingBottom: 20 },
  postBlock: { marginBottom: 20 },
  titre: { ...typography.h2, color: colors.ocean[900], marginBottom: 6 },
  meta: { ...typography.caption, color: colors.neutral.textSecondary, marginBottom: 12 },
  contenu: { ...typography.body, color: colors.ocean[900] },
  commentRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'flex-start' },
  commentPhoto: { width: 28, height: 28, borderRadius: 14 },
  commentPhotoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
  },
  commentAuthor: { ...typography.caption, color: colors.neutral.textSecondary, fontWeight: '600', marginBottom: 4 },
  commentText: { ...typography.body, color: colors.ocean[900] },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 10,
    maxHeight: 100,
    ...typography.body,
    color: colors.ocean[900],
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
