import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Profile } from '../types/profile';
import type { RideRequest } from '../types/rideRequest';

function profileRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  return doc(db, 'profiles', uid);
}

const requestsCollection = collection(db, 'rideRequests');

export async function getRequestedTripIds(): Promise<string[]> {
  const snap = await getDoc(profileRef());
  return (snap.data()?.requestedTripIds as string[] | undefined) ?? [];
}

export async function requestSeat(tripId: string, profile: Profile | null): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  // Id déterministe (trajet + passager) : une seule demande par personne et par trajet.
  const request: RideRequest = {
    id: `${tripId}_${uid}`,
    tripId,
    passagerUid: uid,
    passagerPrenom: profile?.prenom ?? 'Un·e kiteur·se',
    passagerPhotoUri: profile?.photoUri,
    status: 'pending',
    date: new Date().toISOString(),
  };
  await setDoc(doc(requestsCollection, request.id), request);
  await updateDoc(profileRef(), { requestedTripIds: arrayUnion(tripId) });
}

// Le conducteur consulte les demandes reçues sur ses trajets. Firestore
// limite les clauses "in" à 30 valeurs : suffisant, un conducteur n'a pas
// des dizaines de trajets actifs en même temps.
export async function getRequestsForTrips(tripIds: string[]): Promise<RideRequest[]> {
  if (tripIds.length === 0) return [];
  const snap = await getDocs(query(requestsCollection, where('tripId', 'in', tripIds.slice(0, 30))));
  return snap.docs.map((d) => d.data() as RideRequest);
}
