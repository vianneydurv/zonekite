export type ForumTag = 'SESSIONS' | 'MATÉRIEL' | 'SPOTS';

export interface ForumComment {
  id: string;
  auteurPrenom: string;
  auteurPhotoUri?: string;
  contenu: string;
  date: string; // ISO datetime
  // Si la réponse partage un trajet de covoiturage (id dans tripsStorage)
  carpoolTripId?: string;
}

export interface ForumPost {
  id: string;
  auteurPrenom: string;
  auteurPhotoUri?: string;
  titre: string;
  contenu: string;
  date: string; // ISO datetime
  tag: ForumTag;
  commentaires: ForumComment[];
}
