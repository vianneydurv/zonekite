import { useCallback, useState } from 'react';
import {
  Alert,
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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ForumStackParamList } from '../navigation/ForumStackNavigator';
import { colors, typography } from '../theme';
import { addComment, deleteComment, deletePost, getComments, getPosts, updateComment } from '../lib/forumStorage';
import { getProfile } from '../lib/profileStorage';
import { auth } from '../lib/firebase';
import { getTrips } from '../lib/tripsStorage';
import { isCurrentUserAdmin } from '../lib/admin';
import { getMemberPhotos } from '../lib/members';
import { getBlockedUids } from '../lib/blocking';
import Avatar from '../components/Avatar';
import ReportModal, { type ReportContext } from '../components/ReportModal';
import { spots } from '../data/spots';
import type { ForumComment, ForumPost } from '../types/forum';
import type { Trajet } from '../types/trajet';
import { hapticTap } from '../lib/haptics';

type Props = NativeStackScreenProps<ForumStackParamList, 'PostDetail'>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PostDetailScreen({ route }: Props) {
  const { postId } = route.params;
  const navigation = useNavigation<any>();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [draft, setDraft] = useState('');
  const [trips, setTrips] = useState<Trajet[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportContext, setReportContext] = useState<ReportContext | null>(null);
  const [memberPhotos, setMemberPhotos] = useState<Record<string, string>>({});
  const [blockedUids, setBlockedUids] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      getPosts().then((posts) => {
        const found = posts.find((p) => p.id === postId) ?? null;
        setPost(found);
        if (found) getComments(found).then(setComments);
      });
      getTrips().then(setTrips);
      isCurrentUserAdmin().then(setIsAdmin);
      getMemberPhotos().then(setMemberPhotos).catch(() => {});
      getBlockedUids().then(setBlockedUids).catch(() => {});
    }, [postId])
  );

  async function handleSend() {
    if (!draft.trim() || !post) return;
    hapticTap();
    const profile = await getProfile();
    const comment: ForumComment = {
      id: `${Date.now()}`,
      auteurPrenom: profile?.prenom ?? 'Moi',
      auteurPhotoUri: profile?.photoUri,
      contenu: draft.trim(),
      date: new Date().toISOString(),
    };
    await addComment(post.id, comment);
    setComments((cs) => [...cs, { ...comment, auteurUid: auth.currentUser?.uid }]);
    setDraft('');
  }

  function handleDeletePost() {
    if (!post) return;
    Alert.alert('Supprimer ce sujet ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deletePost(post.id);
          navigation.goBack();
        },
      },
    ]);
  }

  function startEditComment(comment: ForumComment) {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.contenu);
  }

  async function saveEditedComment() {
    if (!post || !editingCommentId || !editingCommentText.trim()) return;
    await updateComment(post.id, editingCommentId, editingCommentText.trim());
    setComments((cs) =>
      cs.map((c) => (c.id === editingCommentId ? { ...c, contenu: editingCommentText.trim() } : c))
    );
    setEditingCommentId(null);
  }

  function handleDeleteComment(comment: ForumComment) {
    if (!post) return;
    Alert.alert('Supprimer cette réponse ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteComment(post.id, comment.id);
          setComments((cs) => cs.filter((c) => c.id !== comment.id));
        },
      },
    ]);
  }

  if (!post) return null;

  // Photo actuelle de l'auteur (annuaire), à défaut celle enregistrée avec
  // le message.
  const photoOf = (m: { auteurUid?: string; auteurPhotoUri?: string }) =>
    (m.auteurUid && memberPhotos[m.auteurUid]) || m.auteurPhotoUri;

  // Fiche publique de l'auteur (les anciens messages sans uid ne mènent nulle part).
  function openMember(m: { auteurUid?: string; auteurPrenom: string }) {
    if (m.auteurUid) navigation.navigate('MemberProfile', { uid: m.auteurUid, prenom: m.auteurPrenom });
  }

  const isPostOwner = post.auteurUid != null && post.auteurUid === auth.currentUser?.uid;

  function reportPost() {
    if (!post) return;
    setReportContext({
      targetType: 'post',
      postId: post.id,
      targetUid: post.auteurUid,
      targetPrenom: post.auteurPrenom,
      excerpt: `${post.titre}\n${post.contenu}`.slice(0, 500),
    });
  }

  function reportComment(comment: ForumComment) {
    if (!post) return;
    setReportContext({
      targetType: 'comment',
      postId: post.id,
      commentId: comment.id,
      targetUid: comment.auteurUid,
      targetPrenom: comment.auteurPrenom,
      excerpt: comment.contenu.slice(0, 500),
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color={colors.neutral.white} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{post.titre}</Text>
          <Text style={styles.headerSub}>
            {comments.length} réponse{comments.length > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {isPostOwner && (
            <Pressable
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('CreatePost', { postId: post.id })}
            >
              <Ionicons name="pencil" size={16} color={colors.neutral.white} />
            </Pressable>
          )}
          {!isPostOwner && (
            <Pressable style={styles.headerIconButton} onPress={reportPost}>
              <Ionicons name="flag-outline" size={15} color={colors.neutral.white} />
            </Pressable>
          )}
          {(isPostOwner || isAdmin) && (
            <Pressable style={styles.headerIconButton} onPress={handleDeletePost}>
              <Ionicons name="trash" size={16} color={colors.neutral.white} />
            </Pressable>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Pressable style={styles.authorRow} onPress={() => openMember(post)} disabled={!post.auteurUid}>
              <Avatar prenom={post.auteurPrenom} photoUri={photoOf(post)} size={38} />
              <View>
                <Text style={styles.authorName}>{post.auteurPrenom}</Text>
                <Text style={styles.authorMeta}>{formatDate(post.date)}</Text>
              </View>
            </Pressable>
            <Text style={styles.postText}>{post.contenu}</Text>
          </View>

          {comments
            .filter((comment) => !comment.auteurUid || !blockedUids.includes(comment.auteurUid))
            .map((comment) => {
            const trip = comment.carpoolTripId ? trips.find((t) => t.id === comment.carpoolTripId) : null;
            const tripSpot = trip ? spots.find((s) => s.id === trip.spotId) : null;
            const isCommentOwner = comment.auteurUid != null && comment.auteurUid === auth.currentUser?.uid;
            const isEditing = editingCommentId === comment.id;
            return (
              <View key={comment.id} style={[styles.card, styles.replyCard]}>
                <View style={styles.authorRow}>
                  <Pressable
                    style={[styles.authorRow, { flex: 1 }]}
                    onPress={() => openMember(comment)}
                    disabled={!comment.auteurUid}
                  >
                    <Avatar prenom={comment.auteurPrenom} photoUri={photoOf(comment)} size={30} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.authorNameSmall}>{comment.auteurPrenom}</Text>
                      <Text style={styles.authorMetaSmall}>{formatDate(comment.date)}</Text>
                    </View>
                  </Pressable>
                  {!isEditing && (
                    <View style={styles.headerActions}>
                      {isCommentOwner && (
                        <Pressable style={styles.commentIconButton} onPress={() => startEditComment(comment)}>
                          <Ionicons name="pencil" size={13} color={colors.navy(0.5)} />
                        </Pressable>
                      )}
                      {!isCommentOwner && (
                        <Pressable style={styles.commentIconButton} onPress={() => reportComment(comment)}>
                          <Ionicons name="flag-outline" size={13} color={colors.navy(0.4)} />
                        </Pressable>
                      )}
                      {/* Les anciennes réponses sans auteurUid vivent dans le post
                          lui-même (hors sous-collection) : pas supprimables ici. */}
                      {(isCommentOwner || (isAdmin && comment.auteurUid != null)) && (
                        <Pressable style={styles.commentIconButton} onPress={() => handleDeleteComment(comment)}>
                          <Ionicons name="trash" size={13} color={colors.navy(0.5)} />
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                {isEditing ? (
                  <View>
                    <TextInput
                      style={styles.editInput}
                      value={editingCommentText}
                      onChangeText={setEditingCommentText}
                      multiline
                      autoFocus
                    />
                    <View style={styles.editActionsRow}>
                      <Pressable onPress={() => setEditingCommentId(null)}>
                        <Text style={styles.editCancelText}>Annuler</Text>
                      </Pressable>
                      <Pressable onPress={saveEditedComment} disabled={!editingCommentText.trim()}>
                        <Text style={styles.editSaveText}>Enregistrer</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.replyText}>{comment.contenu}</Text>
                )}

                {trip && tripSpot && (
                  <Pressable
                    style={styles.carpoolCard}
                    onPress={() => navigation.getParent()?.navigate('Carpool')}
                  >
                    <View style={styles.carpoolBadge}>
                      <Text style={styles.carpoolBadgeText}>COVOITURAGE PARTAGÉ</Text>
                    </View>
                    <View style={styles.carpoolBody}>
                      <View>
                        <Text style={styles.carpoolTitle}>{trip.adresseDepart} → {tripSpot.nom}</Text>
                        <Text style={styles.carpoolMeta}>
                          {trip.heureDepart} · {trip.placesDispo} place{trip.placesDispo > 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.navy(0.3)} />
                    </View>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.composerRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Écrire une réponse…"
            placeholderTextColor={colors.navy(0.45)}
            multiline
          />
          <Pressable style={styles.sendButton} onPress={handleSend} disabled={!draft.trim()}>
            <Ionicons name="arrow-up" size={18} color={colors.neutral.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ReportModal
        context={reportContext}
        title={reportContext?.targetType === 'comment' ? 'Signaler cette réponse' : 'Signaler ce sujet'}
        onClose={() => setReportContext(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.background },
  header: {
    backgroundColor: colors.navyBase,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white(0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: typography.h3.fontFamily, fontSize: 15, color: colors.neutral.white },
  headerSub: { ...typography.body, color: colors.white(0.6), marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 6 },
  headerIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white(0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentIconButton: { padding: 4 },
  content: { padding: 14, gap: 11 },
  card: { backgroundColor: colors.neutral.white, borderRadius: 14, padding: 14 },
  replyCard: { marginLeft: 20 },
  authorRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  authorName: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.navyBase },
  authorMeta: { ...typography.body, color: colors.navy(0.45), marginTop: 1 },
  authorNameSmall: { fontFamily: typography.h3.fontFamily, fontSize: 13, color: colors.navyBase },
  authorMetaSmall: { ...typography.body, color: colors.navy(0.45), fontSize: 10.5, marginTop: 1 },
  postText: { ...typography.body, fontSize: 13.5, color: colors.navyBase, marginTop: 10, lineHeight: 20 },
  replyText: { ...typography.body, fontSize: 13, color: colors.navyBase, marginTop: 9, lineHeight: 19 },
  editInput: {
    ...typography.body,
    fontSize: 13,
    color: colors.navyBase,
    marginTop: 9,
    lineHeight: 19,
    backgroundColor: '#F0F4F7',
    borderRadius: 10,
    padding: 10,
    minHeight: 60,
  },
  editActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 },
  editCancelText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.navy(0.5) },
  editSaveText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.accent[700] },
  carpoolCard: { marginTop: 11, borderWidth: 1, borderColor: colors.navy(0.12), borderRadius: 11, overflow: 'hidden' },
  carpoolBadge: { backgroundColor: colors.accent[100], paddingHorizontal: 11, paddingVertical: 7 },
  carpoolBadgeText: { fontFamily: typography.h3.fontFamily, fontSize: 10, color: colors.accent[700], letterSpacing: 0.9 },
  carpoolBody: { padding: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carpoolTitle: { fontFamily: typography.h3.fontFamily, fontSize: 14, color: colors.navyBase },
  carpoolMeta: { ...typography.body, color: colors.navy(0.5), marginTop: 2 },
  composerRow: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.navy(0.09),
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F4F7',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxHeight: 100,
    ...typography.body,
    fontSize: 13,
    color: colors.navyBase,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
