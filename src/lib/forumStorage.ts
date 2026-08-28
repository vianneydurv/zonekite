import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ForumComment, ForumPost } from '../types/forum';
import { demoPosts } from '../data/demoPosts';

// Stockage local en attendant Firebase (étape 9+) : les sujets créés ici ne
// sont visibles que sur cet appareil, pas partagés avec les autres membres.
const POSTS_KEY = '@zonekite/forum-posts';

export async function getPosts(): Promise<ForumPost[]> {
  const raw = await AsyncStorage.getItem(POSTS_KEY);
  if (!raw) {
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(demoPosts));
    return demoPosts;
  }
  return JSON.parse(raw);
}

export async function addPost(post: ForumPost): Promise<void> {
  const posts = await getPosts();
  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify([post, ...posts]));
}

export async function addComment(postId: string, comment: ForumComment): Promise<ForumPost[]> {
  const posts = await getPosts();
  const updated = posts.map((p) =>
    p.id === postId ? { ...p, commentaires: [...p.commentaires, comment] } : p
  );
  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updated));
  return updated;
}
