// Les 8 directions de vent (rose des vents simplifiée)
export type CompassDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

// Contrainte de marée simplifiée pour le moteur de recherche (à affiner en Fonction 1).
// `contrainteMareeDetail` porte la nuance exacte en texte libre.
export type TideConstraint =
  | 'toutes' // navigable à (presque) toute marée
  | 'maree_haute' // uniquement ou de préférence à marée haute
  | 'maree_basse' // uniquement ou de préférence à marée basse
  | 'mi_maree_haute' // de mi-marée à marée haute
  | 'mi_maree_basse' // de mi-marée à marée basse (ou marée descendante)
  | 'variable' // dépend de la zone du spot, règle non réductible à un seul mot
  | 'inconnue'; // pas encore documenté

export type Region =
  | 'Hauts-de-France'
  | 'Normandie'
  | 'Bretagne'
  | 'Vendée'
  | 'Charente-Maritime'
  | 'Gironde'
  | 'Landes / Pays Basque';

export interface Spot {
  id: string;
  nom: string;
  region: Region;
  lat: number;
  lon: number;
  description: string;
  ventMinNoeuds: number | null;
  ventMaxNoeuds: number | null;
  directionsFavorables: CompassDirection[] | null;
  contrainteMaree: TideConstraint;
  contrainteMareeDetail?: string;
  // Niveau requis, en texte libre tel que documenté (pas encore normalisé
  // en catégories fixes — voir Fonction 1 pour le moteur de matching).
  niveauIndicatif?: string;
  // Restrictions saisonnières / horaires, réglementation locale, etc.
  reglementation?: string;
  source: string;
}
