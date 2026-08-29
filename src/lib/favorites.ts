import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

function profileRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  return doc(db, 'profiles', uid);
}

export async function getFavoriteIds(): Promise<string[]> {
  const snap = await getDoc(profileRef());
  return (snap.data()?.favoriteSpotIds as string[] | undefined) ?? [];
}

export async function toggleFavorite(spotId: string): Promise<string[]> {
  const ref = profileRef();
  const current = await getFavoriteIds();
  const isFav = current.includes(spotId);
  await updateDoc(ref, { favoriteSpotIds: isFav ? arrayRemove(spotId) : arrayUnion(spotId) });
  return isFav ? current.filter((id) => id !== spotId) : [...current, spotId];
}
