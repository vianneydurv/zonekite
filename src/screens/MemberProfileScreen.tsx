import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography } from '../theme';
import { getMemberProfile } from '../lib/members';
import Avatar from '../components/Avatar';
import { niveauLabel, type PublicProfile } from '../types/profile';

// Paramètres communs aux piles Forum et Covoit, qui déclarent toutes deux
// cet écran sous le nom « MemberProfile ».
export type MemberProfileParams = { uid: string; prenom: string };

// Fiche publique d'un membre, ouverte en touchant son nom dans le forum ou
// le covoit : photo, niveau, ville et matériel, en lecture seule.
export default function MemberProfileScreen() {
  const navigation = useNavigation();
  const { uid, prenom } = useRoute().params as MemberProfileParams;
  const [member, setMember] = useState<Partial<PublicProfile> | null | undefined>(undefined);

  useEffect(() => {
    getMemberProfile(uid)
      .then(setMember)
      .catch(() => setMember(null));
  }, [uid]);

  const name = member?.prenom ?? prenom;
  const ailes = member?.materiel?.ailes ?? [];
  const boards = member?.materiel?.boards ?? [];
  const autres = member?.materiel?.autres ?? [];
  const materielChips = [
    ...ailes.map((a) => [a.marque, a.modele, a.taille].filter(Boolean).join(' ') || 'Aile'),
    ...boards.map((b) => [b.marque, b.modele].filter(Boolean).join(' ') || 'Board'),
    ...autres.map((a) => a.nom),
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.neutral.white} />
        </Pressable>
        <View style={styles.profileRow}>
          <Avatar prenom={name} photoUri={member?.photoUri} size={72} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.prenom}>{name}</Text>
            {member?.niveau && (
              <Text style={styles.subline}>{niveauLabel(member.niveau, member.genre)}</Text>
            )}
            {member?.ville && (
              <View style={styles.villeRow}>
                <Ionicons name="location-outline" size={13} color={colors.white(0.6)} />
                <Text style={styles.villeText}>{member.ville}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {member === undefined ? (
          <ActivityIndicator color={colors.navyBase} style={{ marginTop: 20 }} />
        ) : member === null ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Ce membre n'a pas encore de fiche publique.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>MATÉRIEL</Text>
            {materielChips.length === 0 ? (
              <Text style={styles.emptyText}>Aucun matériel renseigné</Text>
            ) : (
              <View style={styles.chipRow}>
                {materielChips.map((label, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral.background },
  header: { backgroundColor: colors.navyBase, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white(0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 14 },
  prenom: { fontFamily: typography.h1.fontFamily, fontSize: 23, color: colors.neutral.white, letterSpacing: -0.4 },
  subline: { ...typography.body, color: colors.white(0.6), marginTop: 5 },
  villeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  villeText: { ...typography.body, color: colors.white(0.6) },
  content: { padding: 14, gap: 10 },
  card: { backgroundColor: colors.neutral.white, borderRadius: 14, padding: 14 },
  cardEyebrow: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 10.5,
    color: colors.navy(0.55),
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyText: { ...typography.body, color: colors.neutral.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 9, backgroundColor: '#F0F4F7' },
  chipText: { fontFamily: typography.h3.fontFamily, fontSize: 12, color: colors.navyBase },
});
