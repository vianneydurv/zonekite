import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

function profileRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  return doc(db, 'profiles', uid);
}

export async function getRequestedTripIds(): Promise<string[]> {
  const snap = await getDoc(profileRef());
  return (snap.data()?.requestedTripIds as string[] | undefined) ?? [];
}

export async function requestSeat(tripId: string): Promise<void> {
  await updateDoc(profileRef(), { requestedTripIds: arrayUnion(tripId) });
}
