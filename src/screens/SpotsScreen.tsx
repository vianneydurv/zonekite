import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

// Base de spots : liste consultable, fiche détaillée par spot
export default function SpotsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spots</Text>
      <Text style={styles.subtitle}>La trentaine de spots documentés</Text>
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
