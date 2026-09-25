import { Pressable, StyleSheet, Text, View } from 'react-native';
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

// Pas d'avatar : la hiérarchie repose sur le titre (gros, sur 2 lignes
// max), l'auteur et la date passant en ligne secondaire.
export default function PostCard({ post, onPress }: { post: ForumPost; onPress?: () => void }) {
  const commentCount = post.commentCount ?? post.commentaires?.length ?? 0;
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{post.tag}</Text>
        </View>
        <Text style={styles.time}>{formatRelative(post.date)}</Text>
      </View>
      <Text style={styles.titre} numberOfLines={2}>{post.titre}</Text>
      <Text style={styles.preview} numberOfLines={2}>{post.contenu}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.author}>par {post.auteurPrenom}</Text>
        <Text style={styles.replies}>
          {commentCount} réponse{commentCount > 1 ? 's' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.navy(0.07),
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F0F4F7' },
  tagText: { fontFamily: typography.h3.fontFamily, fontSize: 10, color: colors.navy(0.55), letterSpacing: 0.4 },
  time: { ...typography.body, fontSize: 12, color: colors.navy(0.4) },
  titre: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 18,
    lineHeight: 23,
    color: colors.navyBase,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  preview: { ...typography.body, color: colors.navy(0.55), marginTop: 4, lineHeight: 19 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 },
  author: { fontFamily: typography.h3.fontFamily, fontSize: 11.5, color: colors.navy(0.5) },
  replies: { fontFamily: typography.h3.fontFamily, fontSize: 11.5, color: colors.blue },
});
