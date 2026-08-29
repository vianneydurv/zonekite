import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { SpotRating } from '../types/rating';

function entriesCollection(spotId: string) {
  return collection(db, 'spotRatings', spotId, 'entries');
}

export async function getSpotRatings(spotId: string): Promise<SpotRating[]> {
  const snap = await getDocs(entriesCollection(spotId));
  return snap.docs.map((d) => d.data() as SpotRating);
}

export async function getMyRating(spotId: string): Promise<SpotRating | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(entriesCollection(spotId), uid));
  return snap.exists() ? (snap.data() as SpotRating) : null;
}

export async function rateSpot(spotId: string, value: number, comment?: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  const rating: SpotRating = { uid, value, date: new Date().toISOString(), ...(comment ? { comment } : {}) };
  await setDoc(doc(entriesCollection(spotId), uid), rating);
}

export function averageOf(ratings: SpotRating[]): { average: number; count: number } {
  if (ratings.length === 0) return { average: 0, count: 0 };
  const sum = ratings.reduce((total, r) => total + r.value, 0);
  return { average: sum / ratings.length, count: ratings.length };
}
