export type NiveauKite = 'debutant' | 'intermediaire' | 'confirme' | 'expert';

export interface MaterielItem {
  type: string;
  taille: string;
}

export interface Profile {
  prenom: string;
  photoUri: string;
  niveau: NiveauKite;
  ville?: string;
  materiel: MaterielItem[];
}

export const NIVEAU_LABELS: Record<NiveauKite, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
  expert: 'Expert',
};
