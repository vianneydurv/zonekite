import type { Trajet } from '../types/trajet';

// Trajets de démonstration, visibles au premier lancement en attendant que
// de vrais membres (Firebase, étape 9+) en publient. À retirer une fois le
// backend branché.
function isoInDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const demoTrips: Trajet[] = [
  {
    id: 'demo-1',
    spotId: 'wissant',
    conducteurPrenom: 'Marie',
    date: isoInDays(2),
    heureDepart: '8h',
    heureRetourEstimee: '19h',
    adresseDepart: 'Paris 15e',
    placesDispo: 2,
  },
  {
    id: 'demo-2',
    spotId: 'la-torche-plomeur',
    conducteurPrenom: 'Thomas',
    date: isoInDays(4),
    heureDepart: '6h30',
    heureRetourEstimee: '22h',
    adresseDepart: 'Paris 11e',
    placesDispo: 3,
  },
];
