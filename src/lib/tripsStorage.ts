import { collection, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Trajet } from '../types/trajet';

const tripsCollection = collection(db, 'trips');

export async function getTrips(): Promise<Trajet[]> {
  const snap = await getDocs(query(tripsCollection, orderBy('date')));
  return snap.docs.map((d) => d.data() as Trajet);
}

export async function addTrip(trip: Trajet): Promise<void> {
  await setDoc(doc(tripsCollection, trip.id), trip);
}
