// Base de marques/modèles pour les menus déroulants du profil (ailes et
// boards). Sélection des marques et gammes actuelles les plus courantes,
// pas un catalogue exhaustif — "Autre" permet toujours de sortir de la liste
// (le modèle repasse alors en texte libre).
export const AUTRE = 'Autre';

export const AILE_MODELS_BY_BRAND: Record<string, string[]> = {
  Duotone: ['Rebel', 'Evo', 'Neo', 'Juice'],
  Cabrinha: ['Switchblade', 'Moto', 'Nitro', 'Drifter', 'FX'],
  North: ['Orbit', 'Reach', 'Pulse'],
  Core: ['XR', 'Nexus', 'Section', 'GTS', 'XLite'],
  'F-One': ['Bandit', 'Bandit S', 'Trigger', 'Breeze', 'Bullit'],
  Naish: ['Pivot', 'Boxer', 'Triad'],
  Ozone: ['Catalyst', 'Enduro', 'Edge', 'Reo', 'Zephyr', 'Alpha', 'Hyperlink'],
  Slingshot: ['UFO', 'Rally', 'Turbine', 'SST', 'Machine'],
  Airush: ['Lithium', 'Ultra', 'Session'],
  RRD: ['Religion', 'Obsession', 'Passion', 'Vision'],
  Flysurfer: ['Sonic', 'Peak', 'Soul', 'Hybrid'],
  Eleveight: ['RS', 'FS', 'WS', 'XS'],
};

export const BOARD_MODELS_BY_BRAND: Record<string, string[]> = {
  Cabrinha: ['Ace', 'Spectrum'],
  Core: ['Fusion', 'Choice', 'Era', 'Impact'],
  Duotone: ['Select', 'Soleil', 'Jaime', 'Gonzales'],
  'F-One': ['Trax', 'One', 'Next', 'Mitu Pro'],
  North: ['Atmos', 'Astra', 'Trace', 'Focus', 'Prime'],
  Naish: ['Motion', 'Monarch', 'Alana', 'Traverse'],
  Slingshot: ['Crisis'],
  Nobile: ['NT5', 'T5', 'NHP'],
  RRD: ['Poison', 'Juice', 'Bliss'],
  'Ocean Rodeo': ['Mako', 'Polaris'],
  CrazyFly: ['Raptor', 'Raptor LTD'],
};

export const AILE_BRANDS = [...Object.keys(AILE_MODELS_BY_BRAND), AUTRE];
export const BOARD_BRANDS = [...Object.keys(BOARD_MODELS_BY_BRAND), AUTRE];
