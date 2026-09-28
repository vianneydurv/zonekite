import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { sendReport } from '../lib/moderation';
import { getProfile } from '../lib/profileStorage';
import type { Report } from '../types/moderation';

export type ReportContext = Pick<
  Report,
  'targetType' | 'postId' | 'commentId' | 'tripId' | 'targetUid' | 'targetPrenom' | 'excerpt'
>;

interface Props {
  // null = fermé
  context: ReportContext | null;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

// Feuille « Signaler » : le membre explique ce qui pose problème, le
// signalement part vers les admins (liste dans l'espace admin + notification).
export default function ReportModal({ context, title, subtitle, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  function close() {
    setReason('');
    onClose();
  }

  async function handleSend() {
    if (!context || !reason.trim()) return;
    setSending(true);
    try {
      const profile = await getProfile();
      await sendReport({ ...context, kind: 'user', reason: reason.trim(), reporterPrenom: profile?.prenom });
      close();
      Alert.alert('Merci', "Ton signalement a bien été transmis à l'équipe ZoneKite.");
    } catch {
      Alert.alert('Envoi impossible', 'Le signalement n’a pas pu être envoyé, réessaie.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={context != null} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.icon}>
            <Ionicons name="flag" size={22} color={colors.status.bad} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>
            {subtitle ?? 'Explique en quelques mots ce qui pose problème. Ton signalement reste anonyme pour la personne concernée.'}
          </Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Ce qui s'est passé…"
            placeholderTextColor={colors.navy(0.45)}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelButton} onPress={close} disabled={sending}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.sendButton, (!reason.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!reason.trim() || sending}
            >
              <Text style={styles.sendText}>{sending ? 'Envoi…' : 'Signaler'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.navy(0.45), justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.neutral.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 26, paddingBottom: 34 },
  icon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#FBE9E7', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: typography.h1.fontFamily, fontSize: 20, color: colors.navyBase, marginTop: 14 },
  body: { ...typography.body, color: colors.navy(0.65), marginTop: 8, lineHeight: 19 },
  input: {
    backgroundColor: '#F0F4F7',
    borderRadius: 12,
    padding: 12,
    paddingTop: 12,
    marginTop: 16,
    minHeight: 100,
    maxHeight: 180,
    textAlignVertical: 'top',
    ...typography.body,
    fontSize: 13.5,
    color: colors.navyBase,
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelButton: { flex: 1, backgroundColor: '#F0F4F7', borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  cancelText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.navy(0.6) },
  sendButton: { flex: 1, backgroundColor: colors.status.bad, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  sendText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.neutral.white },
});
