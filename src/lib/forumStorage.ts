import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { ForumComment, ForumPost } from '../types/forum';

const postsCollection = collection(db, 'forumPosts');

export async function getPosts(): Promise<ForumPost[]> {
  const snap = await getDocs(query(postsCollection, orderBy('date', 'desc')));
  return snap.docs.map((d) => d.data() as ForumPost);
}

export async function addPost(post: ForumPost): Promise<void> {
  await setDoc(doc(postsCollection, post.id), post);
}

export async function addComment(postId: string, comment: ForumComment): Promise<ForumPost[]> {
  const ref = doc(postsCollection, postId);
  const snap = await getDoc(ref);
  const post = snap.data() as ForumPost;
  await setDoc(ref, { ...post, commentaires: [...post.commentaires, comment] });
  return getPosts();
}
