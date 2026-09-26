export type Genre = 'homme' | 'femme';

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
  // Obligatoire à la saisie ; optionnel dans le type car les profils créés
  // avant ce champ ne l'ont pas (l'app redemande de compléter le profil).
  genre?: Genre;
  // Obligatoire : sert de point de départ par défaut pour la recherche de spot.
  ville: string;
  materiel: Materiel;
  // Géré séparément par favorites.ts (Firestore arrayUnion/arrayRemove),
  // pas par saveProfile. Les demandes de covoiturage vivent dans la
  // collection rideRequests (voir rideRequests.ts), pas sur le profil.
  favoriteSpotIds?: string[];
}

export const GENRE_LABELS: Record<Genre, string> = {
  homme: 'Homme',
  femme: 'Femme',
};

const NIVEAU_LABELS_HOMME: Record<NiveauKite, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
  expert: 'Expert',
};

const NIVEAU_LABELS_FEMME: Record<NiveauKite, string> = {
  debutant: 'Débutante',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmée',
  expert: 'Experte',
};

export function niveauLabel(niveau: NiveauKite, genre?: Genre | null): string {
  return (genre === 'femme' ? NIVEAU_LABELS_FEMME : NIVEAU_LABELS_HOMME)[niveau];
}

// Libellés accordés selon le genre de la personne concernée. Genre inconnu
// (trajet/profil antérieur au champ) : formulation neutre, sans écriture
// inclusive.
export function conducteurLabel(genre?: Genre | null): string {
  return genre === 'femme' ? 'Conductrice' : genre === 'homme' ? 'Conducteur' : 'Au volant';
}

export function passagerLabel(genre?: Genre | null): string {
  return genre === 'femme' ? 'Passagère' : 'Passager';
}
