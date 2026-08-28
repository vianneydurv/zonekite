// Échelle typographique ZoneKite — Archivo (texte général) + IBM Plex Mono
// (petits libellés monospace : heures, coordonnées), reprises du prototype.

export const fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semiBold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extraBold: 'Archivo_800ExtraBold',
  mono: 'IBMPlexMono_500Medium',
};

export const typography = {
  h1: { fontFamily: fonts.extraBold, fontSize: 25 },
  h2: { fontFamily: fonts.extraBold, fontSize: 23 },
  h3: { fontFamily: fonts.bold, fontSize: 16 },
  body: { fontFamily: fonts.regular, fontSize: 13 },
  bodyBold: { fontFamily: fonts.bold, fontSize: 13 },
  caption: { fontFamily: fonts.semiBold, fontSize: 10.5 },
  mono: { fontFamily: fonts.mono, fontSize: 10.5 },
};
