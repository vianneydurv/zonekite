import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { sendPushToUser, type PushData } from './notifications';

// Les admins sont les documents de la collection admins/{uid}, créés à la
// main depuis la console Firebase (les règles interdisent toute écriture
// depuis l'app) : impossible de s'auto-proclamer admin.
const adminsCollection = collection(db, 'admins');
const bansCollection = collection(db, 'bans');

export async function isCurrentUserAdmin(): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  try {
    return (await getDoc(doc(adminsCollection, uid))).exists();
  } catch {
    return false;
  }
}

// Alerte chaque admin par notification push (hors soi-même). Best effort,
// comme toutes les notifications : ne fait jamais échouer l'action d'origine.
export async function notifyAdmins(title: string, body: string, data: PushData = {}): Promise<void> {
  try {
    const snap = await getDocs(adminsCollection);
    const me = auth.currentUser?.uid;
    await Promise.all(
      snap.docs.filter((d) => d.id !== me).map((d) => sendPushToUser(d.id, title, body, { ...data, admin: true }))
    );
  } catch {
    // ignoré volontairement
  }
}

export async function isBanned(uid: string): Promise<boolean> {
  try {
    return (await getDoc(doc(bansCollection, uid))).exists();
  } catch {
    return false;
  }
}

export async function getBannedUids(): Promise<string[]> {
  const snap = await getDocs(bansCollection);
  return snap.docs.map((d) => d.id);
}

// Un membre banni garde son compte mais ne peut plus rien publier (trajet,
// sujet, réponse, demande de place) : les règles Firestore le bloquent, et
// l'app lui affiche un écran dédié.
export async function banUser(uid: string, prenom?: string): Promise<void> {
  await setDoc(doc(bansCollection, uid), {
    prenom: prenom ?? null,
    date: new Date().toISOString(),
    by: auth.currentUser?.uid ?? null,
  });
}

export async function unbanUser(uid: string): Promise<void> {
  await deleteDoc(doc(bansCollection, uid));
}
