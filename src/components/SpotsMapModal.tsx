import { useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { spotsMapHtml, type MapMarker } from '../lib/mapHtml';
import { LEVEL_COLORS } from './ForecastTable';

interface Props {
  visible: boolean;
  // null = conditions en cours de récupération.
  markers: MapMarker[] | null;
  // Spots sur lesquels cadrer à l'ouverture (ex. résultats de la recherche).
  fitIds?: string[];
  subtitle: string;
  onClose: () => void;
  onSelectSpot: (spotId: string) => void;
}

// Carte plein écran de tous les spots, chaque point coloré selon les
// conditions sur le jour et le créneau recherchés.
export default function SpotsMapModal({ visible, markers, fitIds, subtitle, onClose, onSelectSpot }: Props) {
  const html = useMemo(
    () => (markers ? spotsMapHtml(markers, { fullscreen: true, fitIds }) : null),
    [markers, fitIds]
  );

  function onMessage(e: WebViewMessageEvent) {
    const data = e.nativeEvent.data;
    if (data.startsWith('spot:')) onSelectSpot(data.slice(5));
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>CARTE DES SPOTS</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.neutral.white} />
          </Pressable>
        </View>

        <View style={styles.mapWrap}>
          {html ? (
            <WebView style={styles.map} source={{ html }} onMessage={onMessage} />
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.blue} />
              <Text style={styles.loadingText}>Récupération des conditions…</Text>
            </View>
          )}

          <View style={styles.legend}>
            <LegendItem color={LEVEL_COLORS.bon} label="Bonnes conditions" />
            <LegendItem color={LEVEL_COLORS.moyen} label="Moyennes" />
            <LegendItem color={LEVEL_COLORS.mauvais} label="Peu navigable" />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.navyBase },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontFamily: typography.h1.fontFamily, fontSize: 18, color: colors.neutral.white, letterSpacing: 0.3 },
  subtitle: { ...typography.body, color: colors.white(0.65), marginTop: 2 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white(0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapWrap: { flex: 1, backgroundColor: '#D4E1E9' },
  map: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { ...typography.body, color: colors.navy(0.6) },
  legend: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.neutral.white },
  legendText: { ...typography.caption, color: colors.navy(0.7) },
});
