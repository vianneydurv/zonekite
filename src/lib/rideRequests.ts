import { collection, doc, getDocs, increment, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Profile } from '../types/profile';
import type { RideRequest, RideRequestStatus } from '../types/rideRequest';

const requestsCollection = collection(db, 'rideRequests');

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
}

// Le conducteur consulte les demandes reçues sur ses trajets. Firestore
// limite les clauses "in" à 30 valeurs : suffisant, un conducteur n'a pas
// des dizaines de trajets actifs en même temps.
export async function getRequestsForTrips(tripIds: string[]): Promise<RideRequest[]> {
  if (tripIds.length === 0) return [];
  const snap = await getDocs(query(requestsCollection, where('tripId', 'in', tripIds.slice(0, 30))));
  return snap.docs.map((d) => d.data() as RideRequest);
}

// Le passager consulte le statut de ses propres demandes (tous trajets confondus).
export async function getMyRequests(): Promise<RideRequest[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(query(requestsCollection, where('passagerUid', '==', uid)));
  return snap.docs.map((d) => d.data() as RideRequest);
}

async function setRequestStatus(requestId: string, status: RideRequestStatus): Promise<void> {
  await updateDoc(doc(requestsCollection, requestId), { status });
}

export async function acceptRequest(request: RideRequest): Promise<void> {
  await setRequestStatus(request.id, 'accepted');
  // Une place de moins disponible sur le trajet.
  await updateDoc(doc(db, 'trips', request.tripId), { placesDispo: increment(-1) });
}

export async function refuseRequest(requestId: string): Promise<void> {
  await setRequestStatus(requestId, 'refused');
}
