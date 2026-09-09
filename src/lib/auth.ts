import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet email.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    default:
      return 'Une erreur est survenue, réessaie.';
  }
}

export async function signUp(email: string, password: string): Promise<void> {
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Firebase exige une session récente pour supprimer un compte : on
// redemande le mot de passe juste avant, plutôt que de forcer une
// déconnexion/reconnexion complète.
export async function reauthenticate(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Aucun utilisateur connecté');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}

// À appeler après reauthenticate() et après avoir nettoyé les données
// Firestore du compte (une fois l'utilisateur Auth supprimé, on ne peut
// plus prouver son identité pour les règles Firestore basées sur l'uid).
export async function deleteCurrentUser(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Aucun utilisateur connecté');
  await deleteUser(user);
}
