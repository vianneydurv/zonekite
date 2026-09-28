import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, typography } from '../theme';
import { auth } from '../lib/firebase';
import { banUser, getBannedUids, unbanUser } from '../lib/admin';
import { deleteFeedback, dismissReport, getFeedback, getReports } from '../lib/moderation';
import { getMembers } from '../lib/members';
import { deleteComment, deletePost } from '../lib/forumStorage';
import { deleteTrip } from '../lib/tripsStorage';
import { isRemotePhoto } from '../lib/cloudinary';
import type { Feedback, Member, Report } from '../types/moderation';

type Tab = 'reports' | 'feedback' | 'members';

const TARGET_LABELS: Record<Report['targetType'], string> = {
  post: 'SUJET',
  comment: 'RÉPONSE',
  trip: 'COVOIT',
  member: 'MEMBRE',
  other: 'AUTRE',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Espace admin : signalements (manuels et automatiques), retours des
// membres, liste des membres avec bannissement. Accessible uniquement aux
// comptes présents dans la collection admins (voir lib/admin.ts) — les
// règles Firestore refusent de toute façon ces lectures aux autres.
export default function AdminScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('reports');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [bannedUids, setBannedUids] = useState<string[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getReports(), getFeedback(), getMembers(), getBannedUids()])
      .then(([r, f, m, b]) => {
        setReports(r);
        setFeedback(f);
        setMembers(m);
        setBannedUids(b);
      })
      .catch(() => Alert.alert('Accès refusé', "Ce compte n'a pas les droits admin."))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const me = auth.currentUser?.uid;

  function confirm(title: string, message: string, onConfirm: () => Promise<void>) {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: () => onConfirm().catch(() => Alert.alert('Action impossible', 'Réessaie dans un instant.')),
      },
    ]);
  }

  function handleBan(uid: string, prenom?: string) {
    confirm(
      `Bannir ${prenom ?? 'ce membre'} ?`,
      'Il ne pourra plus publier de sujet, de réponse, de trajet ni demander de place.',
      async () => {
        await banUser(uid, prenom);
        setBannedUids((b) => [...b, uid]);
      }
    );
  }

  function handleUnban(uid: string, prenom?: string) {
    confirm(`Réintégrer ${prenom ?? 'ce membre'} ?`, 'Il pourra de nouveau publier.', async () => {
      await unbanUser(uid);
      setBannedUids((b) => b.filter((id) => id !== uid));
    });
  }

  async function removeReport(reportId: string) {
    await dismissReport(reportId);
    setReports((rs) => rs.filter((r) => r.id !== reportId));
  }

  function handleDeleteContent(report: Report) {
    const label = report.targetType === 'trip' ? 'ce trajet' : report.targetType === 'post' ? 'ce sujet' : 'cette réponse';
    confirm(`Supprimer ${label} ?`, 'Cette action est irréversible.', async () => {
      if (report.targetType === 'trip' && report.tripId) await deleteTrip(report.tripId);
      if (report.targetType === 'post' && report.postId) await deletePost(report.postId);
      if (report.targetType === 'comment' && report.postId && report.commentId) {
        await deleteComment(report.postId, report.commentId);
      }
      await removeReport(report.id);
    });
  }

  function openTarget(report: Report) {
    if (report.tripId) {
      navigation.navigate('Carpool', { screen: 'TripDetail', params: { tripId: report.tripId } });
    } else if (report.postId) {
      navigation.navigate('Forum', { screen: 'PostDetail', params: { postId: report.postId } });
    }
  }

  const canDelete = (r: Report) =>
    (r.targetType === 'trip' && r.tripId) ||
    (r.targetType === 'post' && r.postId) ||
    (r.targetType === 'comment' && r.postId && r.commentId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={colors.neutral.white} />
          </Pressable>
          <Text style={styles.headerTitle}>ESPACE ADMIN</Text>
          <Pressable style={styles.backButton} onPress={load}>
            <Ionicons name="refresh" size={17} color={colors.neutral.white} />
          </Pressable>
        </View>
        <View style={styles.tabRow}>
          {(
            [
              ['reports', `SIGNALEMENTS · ${reports.length}`],
              ['feedback', `AVIS · ${feedback.length}`],
              ['members', `MEMBRES · ${members.length}`],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <Pressable key={key} style={[styles.tabChip, tab === key && styles.tabChipActive]} onPress={() => setTab(key)}>
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.blue} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {tab === 'reports' &&
            (reports.length === 0 ? (
              <Text style={styles.emptyText}>Aucun signalement en attente. Tout est calme.</Text>
            ) : (
              reports.map((report) => {
                const isBanned = report.targetUid != null && bannedUids.includes(report.targetUid);
                return (
                  <View key={report.id} style={styles.card}>
                    <View style={styles.cardTopRow}>
                      <View style={[styles.kindBadge, report.kind === 'auto' && styles.kindBadgeAuto]}>
                        <Text style={[styles.kindBadgeText, report.kind === 'auto' && styles.kindBadgeAutoText]}>
                          {report.kind === 'auto' ? 'DÉTECTION AUTO' : 'SIGNALEMENT'}
                        </Text>
                      </View>
                      <Text style={styles.targetLabel}>{TARGET_LABELS[report.targetType]}</Text>
                      <Text style={styles.dateText}>{formatDate(report.date)}</Text>
                    </View>

                    {report.targetPrenom && (
                      <Text style={styles.cardTitle}>
                        {report.targetPrenom}
                        {isBanned ? ' · banni' : ''}
                      </Text>
                    )}
                    {report.matchedWords && report.matchedWords.length > 0 && (
                      <Text style={styles.matchedText}>Mots détectés : {report.matchedWords.join(', ')}</Text>
                    )}
                    {report.excerpt && <Text style={styles.excerpt}>« {report.excerpt} »</Text>}
                    {report.reason && (
                      <Text style={styles.reason}>
                        <Text style={styles.reasonLabel}>{report.reporterPrenom ?? 'Un membre'} : </Text>
                        {report.reason}
                      </Text>
                    )}

                    <View style={styles.actionsRow}>
                      {(report.tripId || report.postId) && (
                        <Pressable style={styles.actionButton} onPress={() => openTarget(report)}>
                          <Text style={styles.actionText}>Voir</Text>
                        </Pressable>
                      )}
                      {canDelete(report) && (
                        <Pressable style={[styles.actionButton, styles.actionDanger]} onPress={() => handleDeleteContent(report)}>
                          <Text style={[styles.actionText, styles.actionDangerText]}>Supprimer</Text>
                        </Pressable>
                      )}
                      {report.targetUid && report.targetUid !== me && !isBanned && (
                        <Pressable
                          style={[styles.actionButton, styles.actionDanger]}
                          onPress={() => handleBan(report.targetUid!, report.targetPrenom)}
                        >
                          <Text style={[styles.actionText, styles.actionDangerText]}>Bannir</Text>
                        </Pressable>
                      )}
                      <Pressable style={styles.actionButton} onPress={() => removeReport(report.id).catch(() => {})}>
                        <Text style={styles.actionText}>Classer</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            ))}

          {tab === 'feedback' &&
            (feedback.length === 0 ? (
              <Text style={styles.emptyText}>Aucun avis reçu pour l'instant.</Text>
            ) : (
              feedback.map((f) => (
                <View key={f.id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle}>{f.prenom ?? 'Membre'}</Text>
                    <Text style={styles.dateText}>{formatDate(f.date)}</Text>
                  </View>
                  {f.email && <Text style={styles.emailText}>{f.email}</Text>}
                  <Text style={styles.feedbackText}>{f.message}</Text>
                  <View style={styles.actionsRow}>
                    {f.email && (
                      <Pressable
                        style={styles.actionButton}
                        onPress={() =>
                          Linking.openURL(`mailto:${f.email}?subject=${encodeURIComponent('Ton avis sur ZoneKite')}`)
                        }
                      >
                        <Text style={styles.actionText}>Répondre</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={styles.actionButton}
                      onPress={() =>
                        deleteFeedback(f.id)
                          .then(() => setFeedback((fs) => fs.filter((x) => x.id !== f.id)))
                          .catch(() => {})
                      }
                    >
                      <Text style={styles.actionText}>Archiver</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ))}

          {tab === 'members' &&
            members.map((m) => {
              const isBanned = bannedUids.includes(m.uid);
              return (
                <View key={m.uid} style={[styles.card, styles.memberRow]}>
                  {isRemotePhoto(m.photoUri) ? (
                    <Image source={{ uri: m.photoUri }} style={styles.memberPhoto} />
                  ) : (
                    <View style={[styles.memberPhoto, styles.memberPhotoPlaceholder]} />
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {m.prenom}
                      {m.uid === me ? ' (toi)' : ''}
                    </Text>
                    {isBanned && <Text style={styles.bannedText}>BANNI</Text>}
                  </View>
                  {m.uid !== me &&
                    (isBanned ? (
                      <Pressable style={styles.actionButton} onPress={() => handleUnban(m.uid, m.prenom)}>
                        <Text style={styles.actionText}>Réintégrer</Text>
                      </Pressable>
                    ) : (
                      <Pressable style={[styles.actionButton, styles.actionDanger]} onPress={() => handleBan(m.uid, m.prenom)}>
                        <Text style={[styles.actionText, styles.actionDangerText]}>Bannir</Text>
                      </Pressable>
                    ))}
                </View>
              );
            })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.background },
  header: { backgroundColor: colors.navyBase, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white(0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: typography.h1.fontFamily, fontSize: 17, color: colors.neutral.white, letterSpacing: 0.5 },
  tabRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  tabChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.white(0.1) },
  tabChipActive: { backgroundColor: colors.neutral.white },
  tabText: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.white(0.8), letterSpacing: 0.4 },
  tabTextActive: { color: colors.navyBase },
  content: { padding: 14, gap: 10, paddingBottom: 30 },
  emptyText: { ...typography.body, color: colors.neutral.textSecondary, textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: colors.neutral.white, borderRadius: 14, padding: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kindBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FBE9E7' },
  kindBadgeText: { fontFamily: typography.h3.fontFamily, fontSize: 9.5, color: colors.status.bad, letterSpacing: 0.6 },
  kindBadgeAuto: { backgroundColor: '#FDF3E3' },
  kindBadgeAutoText: { color: '#9A6200' },
  targetLabel: { fontFamily: typography.h3.fontFamily, fontSize: 9.5, color: colors.navy(0.5), letterSpacing: 0.6 },
  dateText: { ...typography.body, fontSize: 11, color: colors.navy(0.45), marginLeft: 'auto' },
  cardTitle: { fontFamily: typography.h3.fontFamily, fontSize: 14, color: colors.navyBase, marginTop: 8 },
  matchedText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: '#9A6200', marginTop: 6 },
  excerpt: { ...typography.body, color: colors.navy(0.75), marginTop: 8, lineHeight: 19, fontStyle: 'italic' },
  reason: { ...typography.body, color: colors.navyBase, marginTop: 8, lineHeight: 19 },
  reasonLabel: { fontFamily: typography.h3.fontFamily },
  emailText: { ...typography.body, fontSize: 11.5, color: colors.blue, marginTop: 2 },
  feedbackText: { ...typography.body, fontSize: 13.5, color: colors.navyBase, marginTop: 8, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, backgroundColor: '#F0F4F7' },
  actionText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.navyBase },
  actionDanger: { backgroundColor: '#FBE9E7' },
  actionDangerText: { color: '#C0392B' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  memberPhoto: { width: 40, height: 40, borderRadius: 20 },
  memberPhotoPlaceholder: { backgroundColor: '#CBD8E0' },
  bannedText: { fontFamily: typography.h3.fontFamily, fontSize: 10, color: colors.status.bad, letterSpacing: 0.6, marginTop: 2 },
});
