import { useState } from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { acceptTerms, CGU_URL } from '../lib/terms';

const RULES = [
  'Pas de harcèlement, d’insultes ni de menaces.',
  'Pas de propos haineux ou discriminatoires.',
  'Pas de contenu sexuel, violent ou choquant.',
  'Pas d’usurpation d’identité, de spam ni d’arnaque.',
];

// Acceptation des conditions d'utilisation, exigée avant d'accéder aux
// contenus publiés par les membres (règle 1.2 de l'App Store). Affiché aux
// nouveaux membres comme aux anciens, puis à chaque nouvelle version.
export default function TermsScreen({ onAccepted }: { onAccepted: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function handleAccept() {
    setSaving(true);
    setError(false);
    try {
      await acceptTerms();
      onAccepted();
    } catch {
      setError(true);
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ZONEKITE</Text>
        <Text style={styles.title}>Conditions d'utilisation</Text>
        <Text style={styles.intro}>
          ZoneKite est une communauté : avant d'y entrer, prends connaissance des règles.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tolérance zéro pour les contenus abusifs</Text>
          {RULES.map((rule) => (
            <View key={rule} style={styles.ruleRow}>
              <Ionicons name="close-circle" size={16} color={colors.accent[500]} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
          <Text style={styles.cardBody}>
            Les contenus signalés sont examinés sous 24 heures. Tout contenu abusif est supprimé et son auteur
            peut être suspendu. Tu peux signaler un contenu avec le drapeau, et bloquer un membre depuis sa fiche.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Covoiturage et navigation</Text>
          <Text style={styles.cardBody}>
            ZoneKite met en relation des membres, sans vérifier véhicules ni assurances. Les prévisions sont
            indicatives : tu navigues sous ta propre responsabilité.
          </Text>
        </View>

        <Pressable style={styles.linkRow} onPress={() => Linking.openURL(CGU_URL)}>
          <Text style={styles.linkText}>Lire les conditions complètes</Text>
          <Ionicons name="open-outline" size={14} color={colors.blue} />
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        {error && <Text style={styles.errorText}>Impossible d'enregistrer, vérifie ta connexion.</Text>}
        <Pressable style={[styles.cta, saving && styles.ctaDisabled]} onPress={handleAccept} disabled={saving}>
          <Text style={styles.ctaText}>{saving ? 'ENREGISTREMENT…' : "J'ACCEPTE LES CONDITIONS"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.background },
  content: { padding: 20, paddingTop: 28, gap: 12 },
  eyebrow: { ...typography.mono, color: colors.blue, letterSpacing: 1 },
  title: { ...typography.h2, color: colors.navyBase },
  intro: { ...typography.body, color: colors.neutral.textSecondary, marginBottom: 6 },
  card: { backgroundColor: colors.neutral.white, borderRadius: 14, padding: 16, gap: 9 },
  cardTitle: { fontFamily: typography.h3.fontFamily, fontSize: 14, color: colors.navyBase },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { ...typography.body, flex: 1, color: colors.navyBase },
  cardBody: { ...typography.body, color: colors.navy(0.7), lineHeight: 19 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  linkText: { fontFamily: typography.h3.fontFamily, fontSize: 13, color: colors.blue },
  footer: {
    padding: 16,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.navy(0.08),
    gap: 8,
  },
  errorText: { ...typography.body, color: '#C0392B', textAlign: 'center' },
  cta: { backgroundColor: colors.accent[500], borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontFamily: typography.h3.fontFamily, fontSize: 13, color: colors.neutral.white, letterSpacing: 0.8 },
});
