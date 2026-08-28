import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ForumStackParamList } from '../navigation/ForumStackNavigator';
import { colors, typography } from '../theme';
import { getPosts } from '../lib/forumStorage';
import type { ForumPost } from '../types/forum';
import PostCard from '../components/PostCard';

type Props = NativeStackScreenProps<ForumStackParamList, 'ForumList'>;

// Forum : liste des sujets, création de post, commentaires
export default function ForumListScreen({ navigation }: Props) {
  const [posts, setPosts] = useState<ForumPost[]>([]);

  useFocusEffect(
    useCallback(() => {
      getPosts().then(setPosts);
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { postId: item.id })} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Forum</Text>
            <Text style={styles.subtitle}>Échangez avec la communauté</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun sujet pour l'instant.</Text>}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreatePost')}>
        <Ionicons name="add" size={24} color={colors.neutral.white} />
        <Text style={styles.fabText}>Nouveau sujet</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  listContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  title: { ...typography.h1, color: colors.ocean[900] },
  subtitle: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 8, marginBottom: 16 },
  emptyText: { ...typography.body, color: colors.neutral.textSecondary },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.accent[500],
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fabText: { ...typography.bodyBold, color: colors.neutral.white },
});
