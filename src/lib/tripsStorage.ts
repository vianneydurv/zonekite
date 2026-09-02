import { collection, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Trajet } from '../types/trajet';

const tripsCollection = collection(db, 'trips');

export async function getTrips(): Promise<Trajet[]> {
  const snap = await getDocs(query(tripsCollection, orderBy('date')));
  return snap.docs.map((d) => d.data() as Trajet);
}

export async function addTrip(trip: Trajet): Promise<void> {
  // Firestore refuse d'écrire un champ valant `undefined` (ex. véhicule ou
  // heure de retour laissés vides) : on les retire avant l'envoi.
  const clean = Object.fromEntries(
    Object.entries(trip).filter(([, value]) => value !== undefined)
  ) as unknown as Trajet;
  await setDoc(doc(tripsCollection, trip.id), clean);
}
