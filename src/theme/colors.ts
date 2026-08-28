// Palette ZoneKite — reprise fidèlement du prototype Claude Design
// (fichier "ZoneKite Prototype.dc.html"). Le design n'utilise pas une
// échelle de teintes classique : deux couleurs de référence (navy, bleu
// accent) + des variantes d'opacité systématiques sur le navy et le blanc.

const NAVY_RGB = '6,46,69';

export const colors = {
  navyBase: '#062E45', // navy de référence (headers, texte fort)
  blue: '#0A6EA8', // bleu lien/accent (chevrons, liens, sélection)
  accentOrange: '#FF6B1A', // orange de référence (CTA)
  accentOrangeDark: '#D9530A', // orange foncé (texte sur fond clair, ex: bandeau covoit)
  accentOrangeLight: '#FFF3EA', // bandeau covoiturage clair

  status: {
    good: '#17A673',
    medium: '#F0A020',
    bad: '#E04B3C',
  },

  neutral: {
    white: '#FFFFFF',
    background: '#F4F6F8',
    border: `rgba(${NAVY_RGB},0.12)`,
    textPrimary: '#062E45',
    textSecondary: `rgba(${NAVY_RGB},0.5)`,
  },

  // Opacités du navy de référence, ex: colors.navy(0.45)
  navy: (opacity: number) => `rgba(${NAVY_RGB},${opacity})`,
  // Opacités du blanc, pour texte/éléments sur fond navy, ex: colors.white(0.6)
  white: (opacity: number) => `rgba(255,255,255,${opacity})`,

  // Alias pratiques pour rester compatible avec le code existant
  ocean: {
    50: '#EAF1F6',
    100: '#DCE6EC',
    300: `rgba(${NAVY_RGB},0.45)`,
    500: '#0A6EA8',
    700: '#0A6EA8',
    900: '#062E45',
  },
  accent: {
    100: '#FFF3EA',
    300: '#FFD9BD',
    500: '#FF6B1A',
    700: '#D9530A',
  },
} as const;
