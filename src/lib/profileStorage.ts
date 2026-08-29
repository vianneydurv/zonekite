import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Profile } from '../types/profile';

function profileDoc(uid: string) {
  return doc(db, 'profiles', uid);
}

export async function getProfile(): Promise<Profile | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(profileDoc(uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  await setDoc(profileDoc(uid), profile, { merge: true });
}
