import { Image, StyleSheet, Text, View } from 'react-native';
import { isRemotePhoto } from '../lib/cloudinary';
import { colors, typography } from '../theme';

const AVATAR_COLORS = ['#CBD8E0', '#B9CBD6', '#A8BFCC', '#97B3C2'];

function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// Rond avec la photo du membre, ou son initiale sur fond coloré quand la
// photo n'est pas affichable (absente, ou ancienne uri locale file://…).
export default function Avatar({ prenom, photoUri, size }: { prenom: string; photoUri?: string; size: number }) {
  const circle = { width: size, height: size, borderRadius: size / 2 };
  if (isRemotePhoto(photoUri)) return <Image source={{ uri: photoUri }} style={circle} />;
  return (
    <View style={[circle, styles.fallback, { backgroundColor: avatarColor(prenom) }]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{prenom.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: typography.h3.fontFamily, color: colors.navyBase },
});
