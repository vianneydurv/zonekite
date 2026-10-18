import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// À incrémenter à chaque changement important de public/cgu.html : tous les
// membres devront alors accepter à nouveau les conditions.
export const CGU_VERSION = 1;
export const CGU_URL = 'https://zonekite.web.app/cgu.html';

export async function acceptTerms(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  await setDoc(
    doc(db, 'profiles', uid),
    { cguVersion: CGU_VERSION, cguAcceptedAt: new Date().toISOString() },
    { merge: true }
  );
}
