import { collection, deleteDoc, doc, getCountFromServer, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Profile } from '../types/profile';
import type { Member } from '../types/moderation';

const membersCollection = collection(db, 'members');

// Tient à jour l'entrée publique du membre (prénom, photo). Appelé à chaque
// enregistrement du profil et au lancement de l'app : les comptes créés
// avant l'annuaire y sont ainsi ajoutés au premier lancement.
export async function syncMemberEntry(uid: string, { prenom, photoUri }: Pick<Profile, 'prenom' | 'photoUri'>): Promise<void> {
  await setDoc(doc(membersCollection, uid), { uid, prenom, photoUri: photoUri ?? null, updatedAt: serverTimestamp() }, { merge: true });
}

export async function removeMemberEntry(uid: string): Promise<void> {
  await deleteDoc(doc(membersCollection, uid));
}

// Requête d'agrégation : Firestore renvoie le nombre de documents sans les
// télécharger.
export async function getMemberCount(): Promise<number> {
  const snap = await getCountFromServer(membersCollection);
  return snap.data().count;
}

export async function getMembers(): Promise<Member[]> {
  const snap = await getDocs(membersCollection);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return { uid: d.id, prenom: data.prenom ?? '—', photoUri: data.photoUri ?? undefined } as Member;
    })
    .sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr'));
}
