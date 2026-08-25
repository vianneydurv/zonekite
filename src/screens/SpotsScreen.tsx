import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';
import { spots } from '../data/spots';
import SpotCard from '../components/SpotCard';

// Base de spots : liste consultable, fiche détaillée par spot
export default function SpotsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={spots}
        keyExtractor={(spot) => spot.id}
        renderItem={({ item }) => <SpotCard spot={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Spots</Text>
            <Text style={styles.subtitle}>{spots.length} spots documentés</Text>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  listContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: { ...typography.h1, color: colors.ocean[900] },
  subtitle: { ...typography.body, color: colors.neutral.textSecondary, marginTop: 8, marginBottom: 16 },
});
