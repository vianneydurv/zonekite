import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

// Covoiturage solidaire : trajets proposés par les conducteurs, demandes de place
export default function CarpoolScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Covoiturage</Text>
      <Text style={styles.subtitle}>Organisez vos trajets vers les spots</Text>
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
