import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';
import { getBlockedUids, unblockUser } from '../lib/blocking';
import { getMemberProfile } from '../lib/members';
import Avatar from './Avatar';

interface BlockedMember {
  uid: string;
  prenom: string;
  photoUri?: string;
}

// Liste des membres bloqués (Réglages), avec la possibilité de les débloquer.
export default function BlockedMembersModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [members, setMembers] = useState<BlockedMember[] | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMembers(null);
    getBlockedUids()
      .then((uids) =>
        Promise.all(
          uids.map(async (uid) => {
            const m = await getMemberProfile(uid).catch(() => null);
            // Compte supprimé depuis : plus d'entrée dans l'annuaire.
            return { uid, prenom: m?.prenom ?? 'Membre', photoUri: m?.photoUri };
          })
        )
      )
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [visible]);

  function handleUnblock(uid: string) {
    unblockUser(uid)
      .then(() => setMembers((ms) => (ms ?? []).filter((m) => m.uid !== uid)))
      .catch(() => {});
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Membres bloqués</Text>
          <Text style={styles.body}>Leurs sujets, réponses et trajets ne te sont pas affichés.</Text>

          {members === null ? (
            <ActivityIndicator color={colors.navyBase} style={{ marginVertical: 20 }} />
          ) : members.length === 0 ? (
            <Text style={styles.empty}>Tu n'as bloqué personne.</Text>
          ) : (
            <View style={styles.list}>
              {members.map((m) => (
                <View key={m.uid} style={styles.row}>
                  <Avatar prenom={m.prenom} photoUri={m.photoUri} size={34} />
                  <Text style={styles.name} numberOfLines={1}>{m.prenom}</Text>
                  <Pressable style={styles.unblockButton} onPress={() => handleUnblock(m.uid)}>
                    <Text style={styles.unblockText}>Débloquer</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.navy(0.45), justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 26,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  title: { fontFamily: typography.h1.fontFamily, fontSize: 20, color: colors.navyBase },
  body: { ...typography.body, color: colors.navy(0.65), marginTop: 8, lineHeight: 19 },
  empty: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 18 },
  list: { marginTop: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  name: { flex: 1, fontFamily: typography.h3.fontFamily, fontSize: 14, color: colors.navyBase },
  unblockButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, backgroundColor: '#F0F4F7' },
  unblockText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.blue },
  closeButton: { marginTop: 20, backgroundColor: '#F0F4F7', borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  closeText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.navy(0.6) },
});
