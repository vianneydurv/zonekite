import { collection, doc, getDocs, increment, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Profile } from '../types/profile';
import type { RideRequest, RideRequestStatus } from '../types/rideRequest';
import type { Trajet } from '../types/trajet';
import { spots } from '../data/spots';
import { sendPushToUser } from './notifications';

// « Wissant samedi 27 sept. » — pour le texte des notifications.
function tripLabel(trip: Trajet): string {
  const spot = spots.find((s) => s.id === trip.spotId)?.nom ?? 'ton spot';
  const [y, m, d] = trip.date.split('-').map(Number);
  const day = new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
  return `${spot} ${day}`;
}

const requestsCollection = collection(db, 'rideRequests');

export async function requestSeat(trip: Trajet, profile: Profile | null): Promise<void> {
  const tripId = trip.id;
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  // Id déterministe (trajet + passager) : une seule demande par personne et par trajet.
  const request: RideRequest = {
    id: `${tripId}_${uid}`,
    tripId,
    passagerUid: uid,
    passagerPrenom: profile?.prenom ?? (profile?.genre === 'femme' ? 'Une kiteuse' : 'Un kiteur'),
    passagerPhotoUri: profile?.photoUri,
    status: 'pending',
    date: new Date().toISOString(),
  };
  await setDoc(doc(requestsCollection, request.id), request);

  if (trip.conducteurUid) {
    await sendPushToUser(
      trip.conducteurUid,
      'Nouvelle demande de place',
      `${request.passagerPrenom} veut rejoindre ton covoit pour ${tripLabel(trip)}.`,
      { tripId }
    );
  }
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

export async function acceptRequest(request: RideRequest, trip: Trajet): Promise<void> {
  await setRequestStatus(request.id, 'accepted');
  // Une place de moins disponible sur le trajet.
  await updateDoc(doc(db, 'trips', request.tripId), { placesDispo: increment(-1) });
  await sendPushToUser(
    request.passagerUid,
    'Demande acceptée',
    `${trip.conducteurPrenom} t'emmène : ta place pour ${tripLabel(trip)} est confirmée.`,
    { tripId: trip.id }
  );
}

export async function refuseRequest(request: RideRequest, trip: Trajet): Promise<void> {
  await setRequestStatus(request.id, 'refused');
  await sendPushToUser(
    request.passagerUid,
    'Demande refusée',
    `${trip.conducteurPrenom} ne peut pas t'emmener pour ${tripLabel(trip)}.`,
    { tripId: trip.id }
  );
}
