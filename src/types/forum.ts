export type ForumTag = 'SESSIONS' | 'MATÉRIEL' | 'SPOTS';

export interface ForumComment {
  id: string;
  // Optionnel : absent sur les commentaires écrits avant l'introduction de
  // ce champ (l'ancien modèle les stockait dans post.commentaires, sans
  // uid) — ceux-là restent affichés mais non modifiables/supprimables.
  auteurUid?: string;
  auteurPrenom: string;
  auteurPhotoUri?: string;
  contenu: string;
  date: string; // ISO datetime
  // Si la réponse partage un trajet de covoiturage (id dans tripsStorage)
  carpoolTripId?: string;
}

export interface ForumPost {
  id: string;
  // Optionnel pour la même raison que ForumComment.auteurUid.
  auteurUid?: string;
  auteurPrenom: string;
  auteurPhotoUri?: string;
  titre: string;
  contenu: string;
  date: string; // ISO datetime
  tag: ForumTag;
  // Nombre de réponses, tenu à jour à chaque commentaire (voir la
  // sous-collection forumPosts/{postId}/comments dans forumStorage.ts).
  commentCount?: number;
  // Ancien modèle : commentaires stockés directement sur le post, avant le
  // passage à la sous-collection "comments". Conservé en lecture seule pour
  // ne pas faire disparaître les discussions existantes.
  commentaires?: ForumComment[];
}
