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
  ville?: string;
  materiel: Materiel;
}

export const NIVEAU_LABELS: Record<NiveauKite, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
  expert: 'Expert',
};
