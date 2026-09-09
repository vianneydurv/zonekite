import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';

// Supprime les données Firestore possédées par le compte : profil, trajets
// publiés, demandes de covoiturage, sujets de forum. Les commentaires de
// forum laissés par le compte (sous-collection forumPosts/*/comments) ne
// sont volontairement pas nettoyés ici : les retrouver demanderait une
// requête "collection group" nécessitant un index Firestore dédié, non
// déployé automatiquement. Ils restent visibles, orphelins, comme le sont
// déjà les demandes de covoiturage d'un trajet supprimé.
export async function deleteMyData(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const [trips, requests, posts] = await Promise.all([
    getDocs(query(collection(db, 'trips'), where('conducteurUid', '==', uid))),
    getDocs(query(collection(db, 'rideRequests'), where('passagerUid', '==', uid))),
    getDocs(query(collection(db, 'forumPosts'), where('auteurUid', '==', uid))),
  ]);

  await Promise.all([
    ...trips.docs.map((d) => deleteDoc(d.ref)),
    ...requests.docs.map((d) => deleteDoc(d.ref)),
    ...posts.docs.map((d) => deleteDoc(d.ref)),
    deleteDoc(doc(db, 'profiles', uid)),
  ]);
}
