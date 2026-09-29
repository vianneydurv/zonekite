import { collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { PublicProfile } from '../types/profile';
import type { Member } from '../types/moderation';

const membersCollection = collection(db, 'members');

// Tient à jour l'entrée publique du membre (prénom, photo, niveau, ville,
// matériel). Appelé à chaque enregistrement du profil et au lancement de
// l'app : les comptes créés avant l'annuaire (ou avant l'ajout d'un champ)
// y sont ainsi complétés au premier lancement.
export async function syncMemberEntry(
  uid: string,
  { prenom, photoUri, niveau, genre, ville, materiel }: PublicProfile
): Promise<void> {
  await setDoc(
    doc(membersCollection, uid),
    {
      uid,
      prenom,
      photoUri: photoUri ?? null,
      niveau: niveau ?? null,
      genre: genre ?? null,
      ville: ville ?? null,
      materiel: materiel ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Fiche publique d'un membre. Les champs peuvent manquer tant que le membre
// n'a pas relancé une version de l'app qui les publie.
export async function getMemberProfile(uid: string): Promise<Partial<PublicProfile> | null> {
  const snap = await getDoc(doc(membersCollection, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    prenom: data.prenom ?? undefined,
    photoUri: data.photoUri ?? undefined,
    niveau: data.niveau ?? undefined,
    genre: data.genre ?? undefined,
    ville: data.ville ?? undefined,
    materiel: data.materiel ?? undefined,
  };
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

// Photo actuelle de chaque membre, par uid : les sujets et réponses gardent
// la photo du moment où ils ont été écrits, l'annuaire suit les changements.
export async function getMemberPhotos(): Promise<Record<string, string>> {
  const photos: Record<string, string> = {};
  for (const m of await getMembers()) if (m.photoUri) photos[m.uid] = m.photoUri;
  return photos;
}
