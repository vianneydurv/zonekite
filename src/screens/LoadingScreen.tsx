import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ZONEKITE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ocean[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h1, color: colors.neutral.white, letterSpacing: 2 },
});
