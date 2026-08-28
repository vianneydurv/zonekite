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
    titre: 'Session samedi à Wissant ?',
    contenu:
      "Les modèles annoncent 21 nds d'ouest samedi, plutôt tolérant en direction. Qui est chaud ? Je peux prendre du monde depuis Paris 15e.",
    date: isoHoursAgo(20),
    tag: 'SESSIONS',
    commentaires: [
      {
        id: 'demo-comment-1',
        auteurPrenom: 'Marion',
        contenu: "Je pars plutôt sur Wissant aussi, je monte un covoit :",
        date: isoHoursAgo(10),
        carpoolTripId: 'demo-1',
      },
    ],
  },
  {
    id: 'demo-post-2',
    auteurPrenom: 'Karim',
    titre: 'Vends 9 m North Orbit 2023',
    contenu: 'État nickel, dispo à Vincennes. Photos sur demande.',
    date: isoHoursAgo(28),
    tag: 'MATÉRIEL',
    commentaires: [],
  },
  {
    id: 'demo-post-3',
    auteurPrenom: 'Sarah',
    titre: 'Retour sur La Torche dimanche',
    contenu:
      'Super session, vagues bien formées et vent régulier de secteur ouest. Le spot était plutôt calme en semaine.',
    date: isoHoursAgo(48),
    tag: 'SPOTS',
    commentaires: [],
  },
];
