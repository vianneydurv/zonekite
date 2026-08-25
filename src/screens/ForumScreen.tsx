import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

// Forum : sujets de discussion libres, sans modération formelle
export default function ForumScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forum</Text>
      <Text style={styles.subtitle}>Échangez avec la communauté</Text>
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
