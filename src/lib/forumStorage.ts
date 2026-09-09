import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { ForumComment, ForumPost } from '../types/forum';

const postsCollection = collection(db, 'forumPosts');

export async function getPosts(): Promise<ForumPost[]> {
  const snap = await getDocs(query(postsCollection, orderBy('date', 'desc')));
  return snap.docs.map((d) => d.data() as ForumPost);
}

export async function addPost(post: ForumPost): Promise<void> {
  await setDoc(doc(postsCollection, post.id), { ...post, auteurUid: auth.currentUser?.uid, commentCount: 0 });
}

export async function updatePost(
  postId: string,
  fields: Pick<ForumPost, 'titre' | 'contenu' | 'tag'>
): Promise<void> {
  await updateDoc(doc(postsCollection, postId), fields);
}

export async function deletePost(postId: string): Promise<void> {
  await deleteDoc(doc(postsCollection, postId));
}

function commentsCollection(postId: string) {
  return collection(db, 'forumPosts', postId, 'comments');
}

// Les réponses postées avant le passage à la sous-collection "comments"
// restent dans post.commentaires (voir types/forum.ts) : on les fusionne
// avec la sous-collection pour ne pas les faire disparaître de l'écran.
export async function getComments(post: ForumPost): Promise<ForumComment[]> {
  const snap = await getDocs(query(commentsCollection(post.id), orderBy('date')));
  const fromSubcollection = snap.docs.map((d) => d.data() as ForumComment);
  return [...(post.commentaires ?? []), ...fromSubcollection].sort((a, b) => a.date.localeCompare(b.date));
}

export async function addComment(postId: string, comment: ForumComment): Promise<void> {
  await setDoc(doc(commentsCollection(postId), comment.id), { ...comment, auteurUid: auth.currentUser?.uid });
  await updateDoc(doc(postsCollection, postId), { commentCount: increment(1) });
}

export async function updateComment(postId: string, commentId: string, contenu: string): Promise<void> {
  await updateDoc(doc(commentsCollection(postId), commentId), { contenu });
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(commentsCollection(postId), commentId));
  await updateDoc(doc(postsCollection, postId), { commentCount: increment(-1) });
}
