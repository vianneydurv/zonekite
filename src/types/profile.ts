export type NiveauKite = 'debutant' | 'intermediaire' | 'confirme' | 'expert';

export interface Aile {
  marque: string;
  modele: string;
  taille: string;
}

export interface Board {
  marque: string;
  modele: string;
}

export interface AutreMateriel {
  nom: string;
}

export interface Materiel {
  ailes: Aile[];
  boards: Board[];
  autres: AutreMateriel[];
}

export interface Profile {
  prenom: string;
  photoUri: string;
  niveau: NiveauKite;
  // Obligatoire : sert de point de départ par défaut pour la recherche de spot.
  ville: string;
  materiel: Materiel;
  // Gérés séparément par favorites.ts / rideRequests.ts (Firestore
  // arrayUnion/arrayRemove), pas par saveProfile.
  favoriteSpotIds?: string[];
  requestedTripIds?: string[];
}

export const NIVEAU_LABELS: Record<NiveauKite, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
  expert: 'Expert',
};
