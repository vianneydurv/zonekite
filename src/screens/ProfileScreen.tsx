import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

// Profil utilisateur : prénom, photo, niveau, ville, matériel
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.subtitle}>Vos informations et votre matériel</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    padding: 20,
    paddingTop: 60,
  },
  title: { ...typography.h1, color: colors.ocean[900] },
  subtitle: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 8 },
});
