// Signalement à traiter par un admin : soit envoyé par un membre (bouton
// « Signaler » avec texte explicatif), soit généré automatiquement quand un
// message publié contient un mot grossier (voir lib/moderation.ts).
export type ReportKind = 'user' | 'auto';

export type ReportTarget = 'post' | 'comment' | 'trip' | 'member' | 'other';

export interface Report {
  id: string;
  kind: ReportKind;
  targetType: ReportTarget;
  postId?: string;
  commentId?: string;
  tripId?: string;
  // Auteur du contenu signalé (ou membre signalé) : permet de le bannir
  // directement depuis l'espace admin.
  targetUid?: string;
  targetPrenom?: string;
  // Copie du texte signalé au moment du signalement (il peut être modifié
  // ou supprimé ensuite).
  excerpt?: string;
  // Explication donnée par le membre qui signale.
  reason?: string;
  // Mots détectés, pour un signalement automatique.
  matchedWords?: string[];
  // Membre à l'origine du signalement (l'auteur lui-même pour un
  // signalement automatique : c'est son app qui l'envoie).
  reporterUid: string;
  reporterPrenom?: string;
  date: string; // ISO datetime
}

// Retour / avis / idée d'amélioration envoyé depuis le profil.
export interface Feedback {
  id: string;
  uid: string;
  prenom?: string;
  email?: string;
  message: string;
  date: string; // ISO datetime
}

// Entrée publique de l'annuaire des membres (members/{uid}) : sert au
// compteur de membres du forum et à la liste des membres de l'espace admin.
// Les profils complets restent lisibles par leur seul propriétaire.
export interface Member {
  uid: string;
  prenom: string;
  photoUri?: string;
}
