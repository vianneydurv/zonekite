import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

// Écran central : recherche de spot selon jour, créneau, point de départ, distance max
export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recherche de spot</Text>
      <Text style={styles.subtitle}>
        Trouvez le meilleur spot selon le vent et la marée
      </Text>
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
