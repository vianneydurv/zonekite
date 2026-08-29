import type { Spot } from '../types/spot';

// Base de spots ZoneKite — liste fermée, gérée par l'admin (pas de contribution
// ouverte des utilisateurs). Issue de la recherche menée avec la communauté.
// ⚠️ Coordonnées approximatives à affiner sur une carte avant mise en prod.
// ⚠️ Réglementations saisonnières à revérifier chaque année (dates changeantes
// par arrêté municipal).
export const spots: Spot[] = [
  // ---------------------------------------------------------------
  // HAUTS-DE-FRANCE
  // ---------------------------------------------------------------
  {
    id: 'wissant',
    nom: 'Wissant',
    region: 'Hauts-de-France',
    lat: 50.8833,
    lon: 1.6667,
    mareeRef: '2026-08-29T13:47:00+02:00', // ancre M2 : pleine mer Boulogne-sur-Mer
    description:
      "Spot très venté (effet venturi entre Cap Blanc-Nez et Cap Gris-Nez). Fort marnage, vérifier le coefficient de marée.",
    ventMinNoeuds: 12,
    ventMaxNoeuds: 30,
    directionsFavorables: ['SW', 'S', 'NE'],
    contrainteMaree: 'mi_maree_basse',
    contrainteMareeDetail: 'Marée descendante',
    reglementation: 'Zone kite balisée en été, licence FFVL/AF-Kite obligatoire.',
    source: 'letskite.ch, kitetrip-planner.com',
  },
  {
    id: 'sangatte',
    nom: 'Sangatte',
    region: 'Hauts-de-France',
    lat: 50.95,
    lon: 1.75,
    mareeRef: '2026-08-29T13:47:00+02:00', // ancre M2 : pleine mer Boulogne-sur-Mer
    description:
      "Proche de Wissant, downwind possible Wissant → Sangatte le long des falaises. À compléter : vent/marée précis.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: null,
    contrainteMaree: 'inconnue',
    source: 'wimkite.com',
  },
  {
    id: 'le-crotoy',
    nom: 'Le Crotoy',
    region: 'Hauts-de-France',
    lat: 50.2167,
    lon: 1.6167,
    mareeRef: '2026-08-29T13:47:00+02:00', // ancre M2 : pleine mer Boulogne-sur-Mer
    description:
      "Estuaire de la baie de Somme, plan d'eau flat/peu profond, idéal débutants et freestyle. Attention aux bancs de sable qui découvrent à marée descendante et au courant sortant.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['NW', 'W', 'SW'],
    contrainteMaree: 'maree_haute',
    contrainteMareeDetail: 'Navigable uniquement autour de la marée haute (1h à 2h avant/après selon coefficient) : hors de cette fenêtre, la baie se vide.',
    niveauIndicatif: 'Débutants',
    source: 'theridery.com, kitetrip-planner.com, kiteloopers.com',
  },
  {
    id: 'berck-plage',
    nom: 'Berck-Plage',
    region: 'Hauts-de-France',
    lat: 50.4,
    lon: 1.5667,
    mareeRef: '2026-08-29T13:47:00+02:00', // ancre M2 : pleine mer Boulogne-sur-Mer
    description:
      "Immense plage de sable (Grande Plage), spot très prisé de la communauté. Basse mer = plage immense dégagée, mi-marée = lagunes peu profondes idéales pour progresser. Vent de Sud-Ouest = belles vagues ; Nord à Nord-Ouest = freeride avec thermique. Vent de Nord parfois perturbé par les immeubles. Éviter les orientations Est (offshore).",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['S', 'SW', 'W', 'NW', 'N'],
    contrainteMaree: 'toutes',
    source: 'theridery.com, thespot2be.com, zonextrem.fr',
  },

  // ---------------------------------------------------------------
  // NORMANDIE
  // ---------------------------------------------------------------
  {
    id: 'merville-franceville-plage',
    nom: 'Merville-Franceville-Plage',
    region: 'Normandie',
    lat: 49.2833,
    lon: -0.1333,
    mareeRef: '2026-08-29T12:19:00+02:00', // ancre M2 : pleine mer Ouistreham/Caen
    description:
      "Longue plage de sable, spot le plus connu de Normandie. Freeride à marée haute, freestyle à marée descendante.",
    ventMinNoeuds: 12,
    ventMaxNoeuds: 25,
    directionsFavorables: ['N', 'S'],
    contrainteMaree: 'toutes',
    source: 'kazaden.com, hintigo.fr',
  },
  {
    id: 'siouville-hague',
    nom: 'Siouville-Hague',
    region: 'Normandie',
    lat: 49.6167,
    lon: -1.8333,
    mareeRef: '2026-08-29T22:47:00+02:00', // ancre M2 : pleine mer Cherbourg
    description:
      "Spot de vagues (waveriding), grosses vagues possibles. Rafaleux quand le vent tourne au Sud.",
    ventMinNoeuds: 12,
    ventMaxNoeuds: 28,
    directionsFavorables: ['W', 'SW'],
    contrainteMaree: 'maree_basse',
    source: 'thecornershop.fr',
  },
  {
    id: 'saint-aubin-sur-mer',
    nom: 'Saint-Aubin-sur-Mer',
    region: 'Normandie',
    lat: 49.3333,
    lon: -0.4,
    mareeRef: '2026-08-29T12:19:00+02:00', // ancre M2 : pleine mer Ouistreham/Caen
    description: 'À compléter : vent/marée précis.',
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: null,
    contrainteMaree: 'inconnue',
    source: 'À compléter par la communauté',
  },
  {
    id: 'vierville-sur-mer',
    nom: 'Vierville-sur-Mer',
    region: 'Normandie',
    lat: 49.3667,
    lon: -0.9,
    mareeRef: '2026-08-29T12:19:00+02:00', // ancre M2 : pleine mer Ouistreham/Caen
    description: 'À compléter : vent/marée précis.',
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: null,
    contrainteMaree: 'inconnue',
    source: 'À compléter par la communauté',
  },
  {
    id: 'colleville-montgomery',
    nom: 'Colleville-Montgomery',
    region: 'Normandie',
    lat: 49.3333,
    lon: -0.35,
    mareeRef: '2026-08-29T12:19:00+02:00', // ancre M2 : pleine mer Ouistreham/Caen
    description: 'À compléter : vent/marée précis.',
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: null,
    contrainteMaree: 'inconnue',
    source: 'À compléter par la communauté',
  },

  // ---------------------------------------------------------------
  // BRETAGNE
  // ---------------------------------------------------------------
  {
    id: 'kerhilio-erdeven',
    nom: 'Kerhilio (Erdeven)',
    region: 'Bretagne',
    lat: 47.65,
    lon: -3.15,
    mareeRef: '2026-08-29T18:29:00+02:00', // ancre M2 : pleine mer Le Guilvinec
    description:
      "Spot le plus connu du secteur, à l'entrée nord de la presqu'île de Quiberon. Grande plage de sable, navigable à toutes marées (pas de rochers). Belles vagues à marée haute, plan d'eau plus flat à marée basse.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['NW', 'W'],
    contrainteMaree: 'toutes',
    source: 'kitetrip-planner.com',
  },
  {
    id: 'les-sables-blancs-quiberon',
    nom: 'Les Sables Blancs (Quiberon)',
    region: 'Bretagne',
    lat: 47.51,
    lon: -3.14,
    mareeRef: '2026-08-29T18:29:00+02:00', // ancre M2 : pleine mer Le Guilvinec
    description:
      "Spot abrité côté baie de Quiberon, eau peu profonde façon lagon, idéal débutants/progression (pas de vagues, pas de courant).",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['SE', 'E', 'NE'],
    contrainteMaree: 'mi_maree_haute',
    niveauIndicatif: 'Débutants / progression',
    source: 'kitetrip-planner.com, kite-spirit.com',
  },
  {
    id: 'keremma-treflez',
    nom: 'Keremma (Tréflez)',
    region: 'Bretagne',
    lat: 48.5948,
    lon: -4.6059,
    mareeRef: '2026-08-29T19:57:00+02:00', // ancre M2 : pleine mer Roscoff
    description:
      "5 km de plage entre Kerurus et la baie du Kernic. Toutes orientations de vent possibles grâce à la géographie, optimal SSO à O et NE (thermique printemps). Jamais de vagues cassantes. Rochers affleurant à marée basse (surtout au nord). Spot labellisé FFVL, géré par l'association FKA.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['SW', 'W', 'NE'],
    contrainteMaree: 'toutes',
    contrainteMareeDetail: 'Préférence marée basse. Rochers affleurant à marée basse, surtout au nord.',
    niveauIndicatif: 'Débutant à intermédiaire',
    reglementation: 'Réserve ornithologique de Goulven interdite au kite.',
    source: "letskite.ch, kiteloopers.com, AvelWest",
  },
  {
    id: 'baie-du-kernic-plouescat',
    nom: 'Baie du Kernic (Plouescat)',
    region: 'Bretagne',
    lat: 48.637,
    lon: -4.298,
    mareeRef: '2026-08-29T19:57:00+02:00', // ancre M2 : pleine mer Roscoff
    description:
      "Lagon fermé qui protège des rafales, toutes orientations possibles, meilleur en O/NO. Baie vide à marée basse. Courant à l'embouchure nord à éviter.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['W', 'NW'],
    contrainteMaree: 'mi_maree_haute',
    niveauIndicatif: 'Débutant à intermédiaire, spot de repli',
    source: "letskite.ch, École Kitesurf Bretagne",
  },
  {
    id: 'la-torche-plomeur',
    nom: 'La Torche (Plomeur)',
    region: 'Bretagne',
    lat: 47.837,
    lon: -4.349,
    mareeRef: '2026-08-29T18:29:00+02:00', // ancre M2 : pleine mer Le Guilvinec
    description:
      "Spot de vagues le plus réputé de Bretagne, beach break pouvant atteindre 3 à 3,5 m. O/SO on-shore et E/SE praticables (le vent d'est lève les vagues). Chaos rocheux à la pointe, forte fréquentation surf.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['W', 'SW', 'E', 'SE'],
    contrainteMaree: 'toutes',
    niveauIndicatif: 'Intermédiaire à expert',
    reglementation:
      "Baie d'Audierne classée site naturel protégé (dunes, décollage réglementé hors zones).",
    source: 'Tourisme Bretagne, surf-report.com, plomeur.com',
  },
  {
    id: 'saint-michel-en-greve',
    nom: 'Saint-Michel-en-Grève',
    region: 'Bretagne',
    lat: 48.677,
    lon: -3.572,
    mareeRef: '2026-08-29T19:57:00+02:00', // ancre M2 : pleine mer Roscoff
    description:
      "Grande baie de Plestin-les-Grèves (3-4 km), toutes orientations possibles grâce à la géographie. À marée basse, la mer se retire jusqu'à 3 km (flat, pied partout). Croix de Mi-Lieue balisée, aucun rocher.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: null,
    contrainteMaree: 'toutes',
    contrainteMareeDetail: 'Sauf 2h avant/après la marée haute par coefficient > 80.',
    niveauIndicatif: 'Tous niveaux',
    source: "Let's Kite, Trégor Kite, Tourisme Bretagne",
  },
  {
    id: 'fort-bloque-guidel-ploemeur',
    nom: 'Fort-Bloqué (Guidel/Ploemeur)',
    region: 'Bretagne',
    lat: 47.763,
    lon: -3.515,
    mareeRef: '2026-08-29T18:29:00+02:00', // ancre M2 : pleine mer Le Guilvinec
    description:
      "Spot de vagues, meilleure orientation Sud (side). Rochers près du fort visibles à marée basse, immergés à marée haute. Géré par Guidel Kite Club.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['S', 'SW', 'SE', 'W', 'NW', 'N'],
    contrainteMaree: 'variable',
    contrainteMareeDetail: 'Prudence à mi-marée (rochers immergés).',
    reglementation: 'Zone kite réglementée juillet-août.',
    source: 'Sportihome, Kitetrip-planner, golfedumorbihan56.com',
  },
  {
    id: 'petite-mer-de-gavres',
    nom: 'Petite Mer de Gâvres',
    region: 'Bretagne',
    lat: 47.705,
    lon: -3.35,
    mareeRef: '2026-08-29T18:29:00+02:00', // ancre M2 : pleine mer Le Guilvinec
    description:
      "Mer intérieure abritée près de Lorient, peu de tourisme (zone militaire). Attention à la route proche pour décollage/atterrissage.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['NW', 'W', 'SW', 'S', 'SE', 'E'],
    contrainteMaree: 'maree_haute',
    contrainteMareeDetail: 'Remplissage à mi-marée.',
    source: 'Kitetrip-planner, golfedumorbihan56.com',
  },
  {
    id: 'landrezac-sarzeau',
    nom: 'Landrezac (Sarzeau)',
    region: 'Bretagne',
    lat: 47.505,
    lon: -2.716,
    mareeRef: '2026-08-29T18:29:00+02:00', // ancre M2 : pleine mer Le Guilvinec
    description:
      "Spot principal de la presqu'île de Rhuys. Marée basse pour le flat, belle houle à marée haute. Zone de cours dédiée.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['W', 'SW'],
    contrainteMaree: 'variable',
    contrainteMareeDetail: 'Flat à marée basse, houle à marée haute — praticable à toute marée selon ce qu\'on cherche.',
    source: 'Kite2Rhuys, Kitetrip-planner',
  },
  {
    id: 'penvins-sarzeau',
    nom: 'Penvins (Sarzeau)',
    region: 'Bretagne',
    lat: 47.497,
    lon: -2.685,
    mareeRef: '2026-08-29T18:29:00+02:00', // ancre M2 : pleine mer Le Guilvinec
    description:
      "Pointe de la chapelle : lagune peu profonde (\"bassine\") praticable à marée haute côté Banastère, houle côté mer.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: null,
    contrainteMaree: 'maree_haute',
    contrainteMareeDetail: 'Bassine praticable à marée haute côté Banastère.',
    source: 'Camping La Grée Penvins, Kitetrip-planner',
  },

  // ---------------------------------------------------------------
  // VENDÉE
  // ---------------------------------------------------------------
  {
    id: 'la-tranche-sur-mer-plage-du-phare',
    nom: 'La Tranche-sur-Mer (Plage du Phare)',
    region: 'Vendée',
    lat: 46.343,
    lon: -1.43,
    mareeRef: '2026-08-29T18:22:00+02:00', // ancre M2 : pleine mer Les Sables-d'Olonne
    description:
      "Plage utile par 12-28 nœuds. Baïnes et courants traversiers, zones balnéaires estivales à respecter. Meilleure période avril-octobre.",
    ventMinNoeuds: 12,
    ventMaxNoeuds: 28,
    directionsFavorables: ['SW', 'W', 'S'],
    contrainteMaree: 'toutes',
    niveauIndicatif: 'Intermédiaire recommandé (débutants en école uniquement)',
    source: 'Kiteculture, Sportihome',
  },
  {
    id: 'le-veillon-talmont-saint-hilaire',
    nom: 'Le Veillon (Talmont-Saint-Hilaire)',
    region: 'Vendée',
    lat: 46.46,
    lon: -1.625,
    mareeRef: '2026-08-29T18:22:00+02:00', // ancre M2 : pleine mer Les Sables-d'Olonne
    description:
      "Un des meilleurs spots de Vendée, embouchure du Payré près des Sables d'Olonne. Lagune abritée se formant à mi-marée/marée basse (bassines, pied partout), vagues côté océan.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['W', 'NW'],
    contrainteMaree: 'mi_maree_basse',
    niveauIndicatif: 'Tous niveaux, praticable toute l\'année',
    source: 'Vendée Tourisme, Ocean Players',
  },
  {
    id: 'plage-des-dunes-sables-dolonne',
    nom: "Plage des Dunes (Les Sables-d'Olonne)",
    region: 'Vendée',
    lat: 46.47,
    lon: -1.725,
    mareeRef: '2026-08-29T18:22:00+02:00', // ancre M2 : pleine mer Les Sables-d'Olonne
    description:
      "Zone de pratique 300 m de large, libre hors saison, balisée en juillet-août. Spot labellisé FFVL.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: null,
    contrainteMaree: 'maree_basse',
    contrainteMareeDetail: 'La plage se réduit fortement à marée haute.',
    source: "Let's Kite",
  },
  {
    id: 'fromentine-la-barre-de-monts',
    nom: 'Fromentine (La Barre-de-Monts)',
    region: 'Vendée',
    lat: 46.712,
    lon: -2.147,
    mareeRef: '2026-08-29T18:22:00+02:00', // ancre M2 : pleine mer Les Sables-d'Olonne
    description:
      "Spot d'apprentissage par excellence, entre continent et Noirmoutier. Très clapoteux à marée haute. Forts courants du Passage de Fromentine, ne pas naviguer dans le chenal du port.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['N', 'NW', 'W', 'SW', 'S'],
    contrainteMaree: 'maree_basse',
    contrainteMareeDetail: '-2h/+2h autour de la marée basse (3h pour les débutants).',
    niveauIndicatif: "Tous niveaux, spot d'apprentissage",
    reglementation: 'Interdit du 15 mai au 15 septembre (à vérifier chaque année).',
    source: 'Fromentine Kite, GlissEvolution',
  },
  {
    id: 'barbatre-noirmoutier',
    nom: 'Barbâtre (Île de Noirmoutier)',
    region: 'Vendée',
    lat: 46.883,
    lon: -2.221,
    mareeRef: '2026-08-29T18:22:00+02:00', // ancre M2 : pleine mer Les Sables-d'Olonne
    description:
      "Pointe sud de l'île. Côté baie : eau plate par E/NE, de mi-marée à marée haute. Côté océan : marée descendante-basse par NW/W/SW. Fort marnage, rochers à marée basse côté pont, chenal de navigation interdit.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['E', 'NE', 'NW', 'W', 'SW'],
    contrainteMaree: 'variable',
    contrainteMareeDetail: 'Dépend du côté du spot : baie (mi-marée à haute) vs océan (descendante à basse).',
    niveauIndicatif: 'Débutant à intermédiaire',
    source: "Let's Kite, GlissEvolution",
  },
  {
    id: 'le-gois-noirmoutier',
    nom: 'Le Gois (Noirmoutier, baie)',
    region: 'Vendée',
    lat: 46.945,
    lon: -2.15,
    mareeRef: '2026-08-29T18:22:00+02:00', // ancre M2 : pleine mer Les Sables-d'Olonne
    description:
      "Baie entre le pont et la route submersible du Gois. Plan d'eau parfaitement plat, peu de courant sauf gros coefficient.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: null,
    contrainteMaree: 'maree_basse',
    contrainteMareeDetail: 'Idéal -2h/+2h autour de la marée basse.',
    niveauIndicatif: 'Tous niveaux',
    source: 'GlissEvolution, VVA Natation',
  },

  // ---------------------------------------------------------------
  // CHARENTE-MARITIME
  // ---------------------------------------------------------------
  {
    id: 'chatelaillon-plage',
    nom: 'Châtelaillon-Plage',
    region: 'Charente-Maritime',
    lat: 46.073,
    lon: -1.088,
    mareeRef: '2026-08-29T18:20:00+02:00', // ancre M2 : pleine mer La Rochelle
    description:
      "Grande baie de 3 km, spot familial, vue sur Fort Boyard. Souvent 20-25 nœuds l'été.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['NW', 'SW'],
    contrainteMaree: 'maree_basse',
    contrainteMareeDetail: 'Marche à marée basse (vase à traverser par gros coefficient).',
    niveauIndicatif: 'Débutant à confirmé',
    reglementation: 'Interdit du 15 juin au 15 septembre (à revérifier chaque année). Coquillages coupants.',
    source: 'Guide Charente-Maritime, Kiteloopers, plages.tv',
  },
  {
    id: 'aytre',
    nom: 'Aytré',
    region: 'Charente-Maritime',
    lat: 46.128,
    lon: -1.115,
    mareeRef: '2026-08-29T18:20:00+02:00', // ancre M2 : pleine mer La Rochelle
    description:
      "Sud de La Rochelle, plage ~2 km, spot de slalom/freeride (side-shore). Chaussons indispensables (coquillages), parcs à huîtres.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['SW', 'W', 'NW'],
    contrainteMaree: 'maree_haute',
    contrainteMareeDetail: 'Praticable uniquement autour de la pleine mer (-2h/+2h) : pas de kite à marée basse (vasières).',
    niveauIndicatif: 'Intermédiaire',
    source: 'Guide Charente-Maritime, Let\'s Kite',
  },
  {
    id: 'le-boutillon-ile-de-re',
    nom: 'Le Boutillon (Île de Ré)',
    region: 'Charente-Maritime',
    lat: 46.198,
    lon: -1.398,
    mareeRef: '2026-08-29T18:20:00+02:00', // ancre M2 : pleine mer La Rochelle
    description:
      "La Couarde-sur-Mer. Plage abritée par une digue, peu de place à marée haute. Parcs à huîtres à proximité. Géré par l'association Aile de Ré.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['SW', 'W', 'S', 'SE'],
    contrainteMaree: 'maree_haute',
    contrainteMareeDetail: 'Éviter la marée basse (rochers).',
    niveauIndicatif: 'Tous niveaux',
    reglementation: "Interdit l'été entre 10h et 18h30 (à vérifier chaque année).",
    source: 'Rekiteschool, Thespot2be, Zonextrem',
  },
  {
    id: 'plage-des-seulieres-oleron',
    nom: "Plage des Seulières (Saint-Denis-d'Oléron)",
    region: 'Charente-Maritime',
    lat: 46.02,
    lon: -1.4,
    mareeRef: '2026-08-29T18:20:00+02:00', // ancre M2 : pleine mer La Rochelle
    description:
      "Côte nord-ouest de l'île. Vagues shore-break à marée haute, flat rassurant à marée basse. Rochers au large, deux zones de baignade surveillée en saison.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['SE', 'E', 'NW'],
    contrainteMaree: 'variable',
    contrainteMareeDetail: 'Flat à marée basse (débutant), vagues à marée haute (confirmé).',
    niveauIndicatif: 'Débutant (marée basse) à confirmé (marée haute)',
    reglementation: 'Interdit de traverser les rectangles de 300 m au large des zones de baignade surveillée, en saison.',
    source: 'oleron.fr, Guide Charente-Maritime, Kite Inside',
  },

  // ---------------------------------------------------------------
  // GIRONDE
  // ---------------------------------------------------------------
  {
    id: 'la-hume-gujan-mestras',
    nom: 'La Hume (Gujan-Mestras)',
    region: 'Gironde',
    lat: 44.629,
    lon: -1.077,
    mareeRef: '2026-08-29T19:18:00+02:00', // ancre M2 : pleine mer Arcachon
    description:
      "Fond du bassin d'Arcachon. Plan d'eau flat, pied sur plus d'1 km. Zone réglementée, chenal interdit à la navigation kite.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['NW', 'N', 'NE'],
    contrainteMaree: 'maree_haute',
    contrainteMareeDetail: 'Praticable seulement 2h avant/après la marée haute (marnage minimum ~2,5 m).',
    niveauIndicatif: 'Débutant à confirmé',
    reglementation: 'Fermé d\'octobre à mi-novembre (réservé à la chasse).',
    source: 'Sportihome, Zoomkite',
  },
  {
    id: 'la-salie-sud-la-teste-de-buch',
    nom: 'La Salie Sud (La Teste-de-Buch)',
    region: 'Gironde',
    lat: 44.54,
    lon: -1.245,
    mareeRef: '2026-08-29T19:18:00+02:00', // ancre M2 : pleine mer Arcachon
    description:
      "Océan, ~4 km au sud de la dune du Pyla. Lagon plat entre bancs de sable à marée basse (débutant), vagues pour experts après les bancs. Zone réservée FFVL.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['N', 'S'],
    contrainteMaree: 'maree_basse',
    niveauIndicatif: 'Débutant (lagon) à expert (au large, après les bancs)',
    reglementation:
      'Interdiction estivale stricte à dates variables chaque année (vérifier avant chaque saison) — sauf zone/chenal des Arbousiers à certains horaires.',
    source: 'universkite.fr, APC Kite',
  },
  {
    id: 'lacanau-ocean',
    nom: 'Lacanau Océan',
    region: 'Gironde',
    lat: 45.002,
    lon: -1.196,
    mareeRef: '2026-08-29T19:18:00+02:00', // ancre M2 : pleine mer Arcachon
    description:
      "Thermique de NO (printemps/été). Difficile de passer la barre par vent d'ouest. Baïnes à marée basse.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['NW'],
    contrainteMaree: 'toutes',
    contrainteMareeDetail: 'Baïnes à marée basse, vigilance.',
    niveauIndicatif: 'Expert',
    reglementation: "Interdit avant 19h l'été, sauf zones Super-Sud et Super-Nord réservées kite.",
    source: 'Kitesurf Club Lacanau',
  },

  // ---------------------------------------------------------------
  // LANDES / PAYS BASQUE
  // ---------------------------------------------------------------
  {
    id: 'les-estagnots-seignosse',
    nom: 'Les Estagnots (Seignosse)',
    region: 'Landes / Pays Basque',
    lat: 43.697,
    lon: -1.436,
    mareeRef: '2026-08-29T18:11:00+02:00', // ancre M2 : pleine mer Saint-Jean-de-Luz (Socoa)
    description:
      "Limite Hossegor/Seignosse. Dominants O et NO (houle atlantique), thermique N/NO l'été (se lève 16-17h). Vent de sud instable et rafaleux. Courants de baïne, zone kite dédiée signalée en été.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['W', 'NW'],
    contrainteMaree: 'inconnue',
    niveauIndicatif: 'Intermédiaire à expert',
    source: "Let's Kite, Fun Kite Sud Ouest",
  },
  {
    id: 'la-madrague-anglet',
    nom: 'La Madrague (Anglet)',
    region: 'Landes / Pays Basque',
    lat: 43.532,
    lon: -1.527,
    mareeRef: '2026-08-29T18:11:00+02:00', // ancre M2 : pleine mer Saint-Jean-de-Luz (Socoa)
    description:
      "Meilleures vagues par E/SE et marée basse ; vent d'E et de S = offshore/dangereux. Aérologie perturbée par les immeubles (pas pour débutants). Petite digue immergée selon marée.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['E', 'SE'],
    contrainteMaree: 'maree_basse',
    niveauIndicatif: 'Intermédiaire à expert',
    reglementation:
      "Kite autorisé uniquement du 1er novembre au 31 mai sur les plages d'Anglet (interdit en saison estivale).",
    source: 'Allosurf, Fun Kite Sud Ouest',
  },
  {
    id: 'hendaye',
    nom: 'Hendaye',
    region: 'Landes / Pays Basque',
    lat: 43.372,
    lon: -1.786,
    mareeRef: '2026-08-29T18:11:00+02:00', // ancre M2 : pleine mer Saint-Jean-de-Luz (Socoa)
    description:
      "Embouchure de la Bidassoa, frontière franco-espagnole, 3 km de plage. Fonctionne uniquement par vent de N à NE (tout vent à composante Sud est dangereux/offshore). Courants à l'embouchure.",
    ventMinNoeuds: null,
    ventMaxNoeuds: null,
    directionsFavorables: ['N', 'NE'],
    contrainteMaree: 'mi_maree_basse',
    contrainteMareeDetail: 'Marée basse à mi-marée pour le lancement.',
    niveauIndicatif: 'Débutant encadré à confirmé, spot le plus familial du Pays Basque',
    reglementation: 'Interdit en saison estivale (plage surveillée).',
    source: "Let's Kite, Fun Kite Sud Ouest",
  },
];
