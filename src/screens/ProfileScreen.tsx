import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
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
import { colors, typography } from '../theme';
import { getProfile } from '../lib/profileStorage';
import { authErrorMessage, deleteCurrentUser, reauthenticate, signOut } from '../lib/auth';
import { deleteMyData } from '../lib/accountDeletion';
import { auth } from '../lib/firebase';
import { getTrips } from '../lib/tripsStorage';
import { getMyRequests } from '../lib/rideRequests';
import { getFavoriteIds } from '../lib/favorites';
import { spots } from '../data/spots';
import { niveauLabel, type Profile } from '../types/profile';
import type { Trajet } from '../types/trajet';
import type { RideRequestStatus } from '../types/rideRequest';
import OnboardingScreen from './OnboardingScreen';
import { isCurrentUserAdmin } from '../lib/admin';
import { sendFeedback } from '../lib/moderation';
import ReportModal, { type ReportContext } from '../components/ReportModal';
import BlockedMembersModal from '../components/BlockedMembersModal';
import { CGU_URL } from '../lib/terms';
import { hapticSuccess } from '../lib/haptics';

const NEXT_RIDE_STATUS_LABELS: Record<RideRequestStatus, string> = {
  pending: 'EN ATTENTE',
  accepted: 'CONFIRMÉ',
  refused: 'REFUSÉ',
};

interface NextRide {
  trip: Trajet;
  spotName: string;
  status: RideRequestStatus;
}

// Profil utilisateur : prénom, photo, niveau, ville, matériel
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [carpoolCount, setCarpoolCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [nextRide, setNextRide] = useState<NextRide | null>(null);
  const [editing, setEditing] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [helpReport, setHelpReport] = useState<ReportContext | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile);
      getFavoriteIds().then((ids) => setFavoriteCount(ids.length));
      isCurrentUserAdmin().then(setIsAdmin);

      const uid = auth.currentUser?.uid;
      Promise.all([getTrips(), getMyRequests()]).then(async ([trips, requests]) => {
        const requestedIds = requests.map((r) => r.tripId);
        const mine = trips.filter((t) => t.conducteurUid === uid || requestedIds.includes(t.id));
        setCarpoolCount(mine.length);

        const upcoming = trips
          .filter((t) => requestedIds.includes(t.id))
          .sort((a, b) => a.date.localeCompare(b.date))[0];
        const upcomingRequest = upcoming ? requests.find((r) => r.tripId === upcoming.id) : null;
        if (upcoming && upcomingRequest) {
          const spot = spots.find((s) => s.id === upcoming.spotId);
          setNextRide({ trip: upcoming, spotName: spot?.nom ?? 'Spot inconnu', status: upcomingRequest.status });
        } else {
          setNextRide(null);
        }

      });
    }, [])
  );

  async function handleDeleteAccount() {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      // Reauthentification requise par Firebase pour une suppression de
      // compte. On nettoie les données Firestore tant qu'on est encore
      // authentifié (les règles vérifient l'uid) puis on supprime le
      // compte Auth en dernier — une fois parti, on ne peut plus prouver
      // qui on est pour finir le nettoyage.
      await reauthenticate(deletePassword);
      await deleteMyData();
      await deleteCurrentUser();
    } catch (error) {
      const code = error instanceof Object && 'code' in error ? String(error.code) : '';
      Alert.alert('Suppression impossible', authErrorMessage(code));
      setDeleting(false);
    }
  }

  async function handleSendFeedback() {
    const message = feedbackDraft.trim();
    if (!message) return;
    setSendingFeedback(true);
    try {
      await sendFeedback(message, profile?.prenom);
      hapticSuccess();
      setFeedbackDraft('');
      Alert.alert('Merci !', 'Ton message a bien été envoyé à l’équipe ZoneKite.');
    } catch {
      Alert.alert('Envoi impossible', 'Ton message n’a pas pu être envoyé, réessaie.');
    } finally {
      setSendingFeedback(false);
    }
  }

  // Ferme la feuille Réglages avant d'enchaîner sur l'action choisie (deux
  // Modal ouvertes en même temps s'affichent mal sur iOS).
  function fromSettings(action: () => void) {
    setShowSettings(false);
    setTimeout(action, 250);
  }

  if (!profile) return null;

  if (editing) {
    return (
      <OnboardingScreen
        initialProfile={profile}
        onCancel={() => setEditing(false)}
        onComplete={(p) => {
          setProfile(p);
          setEditing(false);
        }}
      />
    );
  }

  const ailes = profile.materiel?.ailes ?? [];
  const boards = profile.materiel?.boards ?? [];
  const autres = profile.materiel?.autres ?? [];
  const materielChips = [
    ...ailes.map((a) => [a.marque, a.modele, a.taille].filter(Boolean).join(' ') || 'Aile'),
    ...boards.map((b) => [b.marque, b.modele].filter(Boolean).join(' ') || 'Board'),
    ...autres.map((a) => a.nom),
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>PROFIL</Text>
          <View style={styles.headerActions}>
            {isAdmin && (
              <Pressable style={styles.adminPill} onPress={() => navigation.navigate('Admin')}>
                <Ionicons name="shield-checkmark" size={13} color={colors.navyBase} />
                <Text style={styles.adminPillText}>ADMIN</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
              onPress={() => setShowSettings(true)}
              accessibilityLabel="Réglages"
            >
              <Ionicons name="settings-sharp" size={19} color={colors.neutral.white} />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.profileRow} onPress={() => setEditing(true)}>
          <Image source={{ uri: profile.photoUri }} style={styles.photo} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.prenom}>{profile.prenom}</Text>
            <Text style={styles.subline}>
              {niveauLabel(profile.niveau, profile.genre)}
              {profile.ville ? ` · ${profile.ville}` : ''}
            </Text>
            {auth.currentUser?.email && (
              <Text style={styles.emailLine}>{auth.currentUser.email}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.white(0.5)} />
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{carpoolCount}</Text>
            <Text style={styles.statLabel}>COVOITS</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{favoriteCount}</Text>
            <Text style={styles.statLabel}>SPOTS SUIVIS</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        // iOS : fait remonter la case « Ton avis compte » au-dessus du clavier.
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardEyebrow}>MON MATÉRIEL</Text>
            <Pressable onPress={() => setEditing(true)}>
              <Text style={styles.cardLink}>Modifier</Text>
            </Pressable>
          </View>
          {materielChips.length === 0 ? (
            <Text style={styles.emptyText}>Aucun matériel renseigné</Text>
          ) : (
            <View style={styles.chipRow}>
              {materielChips.map((label, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>PROCHAIN TRAJET</Text>
          <View style={styles.nextRideRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextRideTitle}>
                {nextRide ? `Passager chez ${nextRide.trip.conducteurPrenom}` : 'Aucun trajet réservé'}
              </Text>
              <Text style={styles.nextRideSub}>
                {nextRide
                  ? `${nextRide.spotName} · ${nextRide.trip.heureDepart} · ${nextRide.trip.adresseDepart}`
                  : "Réserve une place depuis l'onglet Covoit"}
              </Text>
            </View>
            {nextRide && (
              <View style={nextRide.status === 'accepted' ? styles.statusBadgeGood : styles.statusBadge}>
                <Text style={nextRide.status === 'accepted' ? styles.statusBadgeGoodText : styles.statusBadgeText}>
                  {NEXT_RIDE_STATUS_LABELS[nextRide.status]}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Détouré du reste du profil : c'est un message à l'équipe,
            pas une partie du profil. */}
        <View style={[styles.card, styles.feedbackCard]}>
          <Text style={styles.cardEyebrow}>TON AVIS COMPTE</Text>
          <Text style={styles.feedbackIntro}>
            Un bug, une idée, un spot qui manque ? Écris-nous, on lit tout.
          </Text>
          <TextInput
            style={styles.feedbackInput}
            value={feedbackDraft}
            onChangeText={setFeedbackDraft}
            placeholder="Ton retour, avis ou idée d'amélioration…"
            placeholderTextColor={colors.navy(0.45)}
            multiline
            maxLength={2000}
            editable={!sendingFeedback}
          />
          <Pressable
            style={[styles.feedbackButton, (!feedbackDraft.trim() || sendingFeedback) && styles.feedbackButtonDisabled]}
            onPress={handleSendFeedback}
            disabled={!feedbackDraft.trim() || sendingFeedback}
          >
            <Ionicons name="paper-plane" size={14} color={colors.neutral.white} />
            <Text style={styles.feedbackButtonText}>{sendingFeedback ? 'ENVOI…' : 'ENVOYER'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowSettings(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Réglages</Text>

            <View style={styles.menuGroup}>
              <MenuRow icon="person-outline" label="Modifier mon profil" onPress={() => fromSettings(() => setEditing(true))} />
              <MenuRow
                icon="flag-outline"
                label="Aide & signalement"
                sub="Signaler un membre ou une conversation"
                onPress={() => fromSettings(() => setHelpReport({ targetType: 'other' }))}
              />
              <MenuRow
                icon="ban-outline"
                label="Membres bloqués"
                onPress={() => fromSettings(() => setShowBlocked(true))}
              />
              <MenuRow
                icon="document-text-outline"
                label="Conditions d'utilisation"
                onPress={() => fromSettings(() => Linking.openURL(CGU_URL))}
              />
              {isAdmin && (
                <MenuRow
                  icon="shield-checkmark-outline"
                  label="Espace admin"
                  sub="Signalements, avis, membres"
                  onPress={() => fromSettings(() => navigation.navigate('Admin'))}
                />
              )}
            </View>

            <View style={styles.menuGroup}>
              <MenuRow icon="log-out-outline" label="Se déconnecter" onPress={() => fromSettings(() => signOut())} />
              <MenuRow
                icon="trash-outline"
                label="Supprimer mon compte"
                danger
                onPress={() => fromSettings(() => setShowDeleteAccount(true))}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <BlockedMembersModal visible={showBlocked} onClose={() => setShowBlocked(false)} />

      <ReportModal
        context={helpReport}
        title="Aide & signalement"
        subtitle="Un membre au comportement déplacé, une conversation qui dérape ? Indique qui est concerné et ce qui s'est passé : l'équipe ZoneKite s'en occupe."
        onClose={() => setHelpReport(null)}
      />

      <Modal visible={showDeleteAccount} transparent animationType="fade">
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Supprimer ton compte ?</Text>
            <Text style={styles.sheetBody}>
              Action définitive et irréversible. Confirme avec ton mot de passe pour continuer.
            </Text>
            <TextInput
              style={styles.sheetInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Mot de passe"
              placeholderTextColor={colors.navy(0.45)}
              secureTextEntry
              autoCapitalize="none"
              editable={!deleting}
            />
            <View style={styles.sheetActionsRow}>
              <Pressable
                style={styles.sheetCancelButton}
                onPress={() => {
                  setShowDeleteAccount(false);
                  setDeletePassword('');
                }}
                disabled={deleting}
              >
                <Text style={styles.sheetCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.sheetDeleteButton, (!deletePassword || deleting) && styles.sheetDeleteButtonDisabled]}
                onPress={handleDeleteAccount}
                disabled={!deletePassword || deleting}
              >
                <Text style={styles.sheetDeleteText}>{deleting ? 'Suppression...' : 'Supprimer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  label,
  sub,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const tint = danger ? '#C0392B' : colors.navyBase;
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: tint }]}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.navy(0.3)} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.background },
  header: { backgroundColor: colors.navyBase, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { ...typography.h2, color: colors.neutral.white, letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.white(0.12),
    borderWidth: 1,
    borderColor: colors.white(0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonPressed: { backgroundColor: colors.white(0.22) },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.accent[300],
  },
  adminPillText: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.navyBase, letterSpacing: 0.6 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 16 },
  photo: { width: 72, height: 72, borderRadius: 36 },
  prenom: { fontFamily: typography.h1.fontFamily, fontSize: 23, color: colors.neutral.white, letterSpacing: -0.4 },
  subline: { ...typography.body, color: colors.white(0.6), marginTop: 5 },
  emailLine: { ...typography.body, fontSize: 11.5, color: colors.white(0.4), marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  statTile: { flex: 1, backgroundColor: colors.white(0.1), borderRadius: 11, padding: 11 },
  statValue: { fontFamily: typography.h1.fontFamily, fontSize: 19, color: colors.neutral.white },
  statLabel: { fontFamily: typography.h3.fontFamily, fontSize: 9, color: colors.white(0.55), letterSpacing: 0.8, marginTop: 2 },
  body: { flex: 1 },
  bodyContent: { padding: 14, paddingTop: 14, gap: 10 },
  card: { backgroundColor: colors.neutral.white, borderRadius: 14, padding: 14 },
  feedbackCard: { borderWidth: 1, borderColor: colors.blue, marginTop: 18 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  cardEyebrow: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.navy(0.55), letterSpacing: 1 },
  cardLink: { fontFamily: typography.h3.fontFamily, fontSize: 11.5, color: colors.blue },
  emptyText: { ...typography.body, color: colors.neutral.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 9, backgroundColor: '#F0F4F7' },
  chipText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.navyBase },
  nextRideRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextRideTitle: { fontFamily: typography.h3.fontFamily, fontSize: 14.5, color: colors.navyBase },
  nextRideSub: { ...typography.body, color: colors.navy(0.5), marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FDF3E3' },
  statusBadgeText: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: '#9A6200' },
  statusBadgeGood: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EAF7F1' },
  statusBadgeGoodText: { fontFamily: typography.h3.fontFamily, fontSize: 10.5, color: colors.status.good },
  feedbackIntro: { ...typography.body, color: colors.navy(0.6), marginTop: 6, lineHeight: 18 },
  feedbackInput: {
    backgroundColor: '#F0F4F7',
    borderRadius: 12,
    padding: 12,
    paddingTop: 12,
    marginTop: 11,
    minHeight: 84,
    textAlignVertical: 'top',
    ...typography.body,
    fontSize: 13.5,
    color: colors.navyBase,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: 13,
  },
  feedbackButtonDisabled: { opacity: 0.45 },
  feedbackButtonText: { fontFamily: typography.h3.fontFamily, fontSize: 12.5, color: colors.neutral.white, letterSpacing: 0.4 },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.navy(0.15), marginBottom: 16 },
  menuGroup: { backgroundColor: colors.neutral.background, borderRadius: 14, marginTop: 14, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 11 },
  menuRowPressed: { backgroundColor: colors.navy(0.05) },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: '#FBE9E7' },
  menuLabel: { fontFamily: typography.h3.fontFamily, fontSize: 14 },
  menuSub: { ...typography.body, fontSize: 11.5, color: colors.navy(0.5), marginTop: 1 },
  sheetBackdrop: { flex: 1, backgroundColor: colors.navy(0.45), justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.neutral.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 26, paddingBottom: 34 },
  sheetTitle: { fontFamily: typography.h1.fontFamily, fontSize: 20, color: colors.navyBase },
  sheetBody: { ...typography.body, color: colors.navy(0.65), marginTop: 8, lineHeight: 19 },
  sheetInput: {
    backgroundColor: '#F0F4F7',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    ...typography.body,
    color: colors.navyBase,
  },
  sheetActionsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  sheetCancelButton: { flex: 1, backgroundColor: '#F0F4F7', borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  sheetCancelText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.navy(0.6) },
  sheetDeleteButton: { flex: 1, backgroundColor: '#C0392B', borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  sheetDeleteButtonDisabled: { opacity: 0.5 },
  sheetDeleteText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.neutral.white },
});
