import { useState } from 'react';
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
import { colors, typography } from '../theme';
import { signIn, signUp } from '../lib/auth';

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet email.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    default:
      return 'Une erreur est survenue, réessaie.';
  }
}

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (error) {
      const code = error instanceof Object && 'code' in error ? String(error.code) : '';
      Alert.alert('Connexion impossible', authErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ZONEKITE</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
          <Text style={styles.title}>{mode === 'login' ? 'Bon retour' : 'Créer un compte'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Connecte-toi pour retrouver ta communauté kite.'
              : 'Rejoins la communauté pour accéder aux spots et au covoiturage.'}
          </Text>

          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ton@email.com"
            placeholderTextColor={colors.neutral.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="6 caractères minimum"
            placeholderTextColor={colors.neutral.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />

          <Pressable
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'PATIENTE...' : mode === 'login' ? 'SE CONNECTER' : "S'INSCRIRE"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.switchModeLink}
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            <Text style={styles.switchModeText}>
              {mode === 'login' ? 'Pas encore de compte ? Inscris-toi' : 'Déjà un compte ? Connecte-toi'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ocean[900] },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  headerTitle: { ...typography.h2, color: colors.neutral.white, letterSpacing: 1 },
  card: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  title: { ...typography.h2, color: colors.ocean[900] },
  subtitle: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 6, marginBottom: 24 },
  fieldLabel: {
    ...typography.caption,
    color: colors.neutral.textSecondary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
    ...typography.body,
    color: colors.ocean[900],
  },
  submitButton: {
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { ...typography.bodyBold, color: colors.neutral.white, letterSpacing: 0.5 },
  switchModeLink: { alignItems: 'center', marginTop: 20 },
  switchModeText: { ...typography.caption, color: colors.ocean[700], fontWeight: '600' },
});
