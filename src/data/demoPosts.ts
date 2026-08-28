import type { ForumPost } from '../types/forum';

// Sujets de démonstration, visibles au premier lancement en attendant que
// de vrais membres (Firebase, étape 9+) en publient. À retirer une fois le
// backend branché.
function isoHoursAgo(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const demoPosts: ForumPost[] = [
  {
    id: 'demo-post-1',
    auteurPrenom: 'Camille',
    titre: 'Conditions à Wissant ce week-end ?',
    contenu:
      "Quelqu'un a des retours récents sur Wissant ? Les modèles annoncent du 20-25 nds samedi mais je me méfie de l'effet venturi local.",
    date: isoHoursAgo(20),
    commentaires: [
      {
        id: 'demo-comment-1',
        auteurPrenom: 'Julien',
        contenu: "J'y étais mercredi, ça tournait bien tant que le coefficient de marée restait raisonnable.",
        date: isoHoursAgo(10),
      },
    ],
  },
  {
    id: 'demo-post-2',
    auteurPrenom: 'Sarah',
    titre: 'Retour de session à La Torche',
    contenu:
      'Super session hier, vagues bien formées et vent régulier de secteur ouest. Le spot était plutôt calme en semaine.',
    date: isoHoursAgo(48),
    commentaires: [],
  },
];
