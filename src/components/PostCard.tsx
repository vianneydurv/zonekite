import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ForumPost } from '../types/forum';
import { colors, typography } from '../theme';

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / 3600000);
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

export default function PostCard({ post, onPress }: { post: ForumPost; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.titre} numberOfLines={2}>{post.titre}</Text>
      <Text style={styles.contenu} numberOfLines={2}>{post.contenu}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{post.auteurPrenom}</Text>
        <Text style={styles.footerDot}>·</Text>
        <Text style={styles.footerText}>{formatRelative(post.date)}</Text>
        <View style={styles.commentBadge}>
          <Ionicons name="chatbubble-outline" size={12} color={colors.neutral.textSecondary} />
          <Text style={styles.commentCount}>{post.commentaires.length}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  titre: { ...typography.h3, color: colors.ocean[900], marginBottom: 4 },
  contenu: { ...typography.body, color: colors.neutral.textSecondary, marginBottom: 10 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { ...typography.caption, color: colors.neutral.textSecondary },
  footerDot: { ...typography.caption, color: colors.neutral.textSecondary, marginHorizontal: 2 },
  commentBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  commentCount: { ...typography.caption, color: colors.neutral.textSecondary },
});
