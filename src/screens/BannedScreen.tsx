import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { signOut } from '../lib/auth';

// Affiché à la place de l'app pour un compte banni par un admin. Les règles
// Firestore bloquent de toute façon ses publications ; cet écran évite de
// le laisser buter sur des erreurs incompréhensibles.
export default function BannedScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="ban" size={30} color={colors.status.bad} />
        </View>
        <Text style={styles.title}>Compte suspendu</Text>
        <Text style={styles.body}>
          Ton compte a été suspendu par l'équipe ZoneKite suite à un manquement aux règles de la
          communauté. Pour toute question, écris à vividurv@gmail.com.
        </Text>
        <Pressable style={styles.button} onPress={() => signOut()}>
          <Text style={styles.buttonText}>SE DÉCONNECTER</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.navyBase },
  content: { flex: 1, justifyContent: 'center', padding: 28 },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.white(0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h1, color: colors.neutral.white, marginTop: 20 },
  body: { ...typography.body, fontSize: 14, color: colors.white(0.7), marginTop: 10, lineHeight: 21 },
  button: {
    backgroundColor: colors.white(0.12),
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: { fontFamily: typography.h3.fontFamily, fontSize: 13.5, color: colors.neutral.white, letterSpacing: 0.3 },
});
