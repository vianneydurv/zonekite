import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

export default function LoadingScreen() {
  return (
    <ImageBackground
      source={require('../../assets/loading-photo.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>ZONEKITE</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ocean[900],
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 46, 69, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h1, color: colors.neutral.white, letterSpacing: 2 },
});
