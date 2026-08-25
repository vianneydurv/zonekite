// Palette ZoneKite : bleu océan (structure) + orange (actions, covoiturage)

export const colors = {
  // Bleu océan — couleur principale
  ocean: {
    50: '#EAF4F8',
    100: '#CFE6EF',
    300: '#7FB8D1',
    500: '#0E7AA8', // bleu océan de référence
    700: '#0A5578',
    900: '#062F44', // quasi noir-bleu, pour les textes forts
  },
  // Orange — couleur d'accent (actions, covoiturage)
  accent: {
    100: '#FFE3D1',
    300: '#FFB27A',
    500: '#FF7A26', // orange de référence
    700: '#D9600F',
  },
  // Statuts météo/marée (vert/orange/rouge du code couleur des spots)
  status: {
    good: '#2E9E5B',   // conditions bonnes
    medium: '#F2A93B', // conditions moyennes
    bad: '#E0483E',    // conditions faibles / non navigables
  },
  neutral: {
    white: '#FFFFFF',
    background: '#F5F9FB',
    border: '#E1EBEF',
    textPrimary: '#0A2530',
    textSecondary: '#5A7684',
  },
} as const;
