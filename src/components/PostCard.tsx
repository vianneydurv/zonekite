import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ForumPost } from '../types/forum';
import { colors, typography } from '../theme';

const AVATAR_COLORS = ['#CBD8E0', '#B9CBD6', '#A8BFCC', '#97B3C2'];

function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

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
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: avatarColor(post.auteurPrenom) }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.titre} numberOfLines={1}>{post.titre}</Text>
          <Text style={styles.time}>{formatRelative(post.date)}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>{post.contenu}</Text>
        <View style={styles.footerRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{post.tag}</Text>
          </View>
          <Text style={styles.replies}>
            {post.commentaires.length} réponse{post.commentaires.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.navy(0.07),
  },
  avatar: { width: 42, height: 42, borderRadius: 21, flexShrink: 0 },
  body: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  titre: { fontFamily: typography.h1.fontFamily, fontSize: 14.5, color: colors.navyBase, flexShrink: 1 },
  time: { ...typography.body, color: colors.navy(0.4), flexShrink: 0 },
  preview: { ...typography.body, color: colors.navy(0.55), marginTop: 3 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F0F4F7' },
  tagText: { fontFamily: typography.h3.fontFamily, fontSize: 10, color: colors.navy(0.55) },
  replies: { fontFamily: typography.h3.fontFamily, fontSize: 11, color: colors.navy(0.45) },
});
