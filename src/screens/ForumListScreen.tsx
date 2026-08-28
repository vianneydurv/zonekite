import { useCallback, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ForumStackParamList } from '../navigation/ForumStackNavigator';
import { colors, typography } from '../theme';
import { getPosts } from '../lib/forumStorage';
import type { ForumPost, ForumTag } from '../types/forum';
import PostCard from '../components/PostCard';

type Props = NativeStackScreenProps<ForumStackParamList, 'ForumList'>;

const FILTERS: ('TOUT' | ForumTag)[] = ['TOUT', 'SESSIONS', 'MATÉRIEL', 'SPOTS'];

// Forum : liste des sujets, création de post, commentaires
export default function ForumListScreen({ navigation }: Props) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [filter, setFilter] = useState<'TOUT' | ForumTag>('TOUT');

  useFocusEffect(
    useCallback(() => {
      getPosts().then(setPosts);
    }, [])
  );

  const visiblePosts = filter === 'TOUT' ? posts : posts.filter((p) => p.tag === filter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>FORUM</Text>
          <Text style={styles.headerMeta}>712 MEMBRES</Text>
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={visiblePosts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { postId: item.id })} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun sujet pour l'instant.</Text>}
        contentContainerStyle={visiblePosts.length === 0 ? styles.emptyList : undefined}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreatePost')}>
        <Ionicons name="add" size={28} color={colors.neutral.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.white },
  header: { backgroundColor: colors.navyBase, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  headerTitle: { ...typography.h2, color: colors.neutral.white, letterSpacing: -0.3 },
  headerMeta: { ...typography.mono, color: colors.white(0.55) },
  filterRow: { flexDirection: 'row', gap: 6, marginTop: 13 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.white(0.1) },
  filterChipActive: { backgroundColor: colors.neutral.white },
  filterText: { fontFamily: typography.body.fontFamily, fontSize: 11, color: colors.white(0.8) },
  filterTextActive: { fontFamily: typography.h3.fontFamily, color: colors.navyBase },
  emptyText: { ...typography.body, color: colors.neutral.textSecondary, padding: 20 },
  emptyList: { flexGrow: 1 },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
