import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Membres bloqués, rangés dans le profil (privé) : leurs sujets, réponses
// et trajets sont filtrés à l'affichage, côté app.
function profileRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  return doc(db, 'profiles', uid);
}

export async function getBlockedUids(): Promise<string[]> {
  const snap = await getDoc(profileRef());
  return (snap.data()?.blockedUids as string[] | undefined) ?? [];
}

export async function blockUser(uid: string): Promise<void> {
  await updateDoc(profileRef(), { blockedUids: arrayUnion(uid) });
}

export async function unblockUser(uid: string): Promise<void> {
  await updateDoc(profileRef(), { blockedUids: arrayRemove(uid) });
}
