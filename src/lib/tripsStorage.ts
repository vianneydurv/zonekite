import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Trajet } from '../types/trajet';
import { localDateIso } from './matching';

const tripsCollection = collection(db, 'trips');

export async function getTrips(): Promise<Trajet[]> {
  const snap = await getDocs(query(tripsCollection, orderBy('date')));
  // Un trajet dont la date de départ est passée n'a plus lieu d'apparaître
  // dans les listes/compteurs de covoiturage (reste en base, juste filtré
  // à la lecture — pas de suppression, au cas où on veuille un historique).
  const todayIso = localDateIso(new Date());
  return snap.docs
    .map((d) => d.data() as Trajet)
    .filter((trip) => trip.date >= todayIso);
}

// Sert à la fois pour publier un nouveau trajet et pour enregistrer les
// modifications d'un trajet existant (même id => setDoc le remplace).
export async function addTrip(trip: Trajet): Promise<void> {
  // Firestore refuse d'écrire un champ valant `undefined` (ex. véhicule ou
  // heure de retour laissés vides) : on les retire avant l'envoi. Comme
  // setDoc remplace tout le document, un champ optionnel retiré à
  // l'édition disparaît bien du document (pas de résidu de l'ancienne valeur).
  const clean = Object.fromEntries(
    Object.entries(trip).filter(([, value]) => value !== undefined)
  ) as unknown as Trajet;
  await setDoc(doc(tripsCollection, trip.id), clean);
}

export async function deleteTrip(tripId: string): Promise<void> {
  await deleteDoc(doc(tripsCollection, tripId));
}

// Le prénom et la photo du conducteur sont copiés dans chaque trajet à sa
// création (les profils ne sont lisibles que par leur propriétaire) : on
// les resynchronise quand le conducteur modifie son profil, sinon ses
// trajets déjà publiés garderaient l'ancienne photo.
export async function syncDriverInfoOnMyTrips(uid: string, prenom: string, photoUri: string): Promise<void> {
  const snap = await getDocs(query(tripsCollection, where('conducteurUid', '==', uid)));
  // Seuls les trajets réellement désynchronisés sont réécrits : appelé à
  // chaque lancement de l'app, ça évite des écritures inutiles.
  const stale = snap.docs.filter((d) => {
    const trip = d.data() as Trajet;
    return trip.conducteurPrenom !== prenom || trip.conducteurPhotoUri !== photoUri;
  });
  await Promise.all(
    stale.map((d) => updateDoc(d.ref, { conducteurPrenom: prenom, conducteurPhotoUri: photoUri }))
  );
}
