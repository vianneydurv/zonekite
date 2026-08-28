export interface ForumComment {
  id: string;
  auteurPrenom: string;
  auteurPhotoUri?: string;
  contenu: string;
  date: string; // ISO datetime
}

export interface ForumPost {
  id: string;
  auteurPrenom: string;
  auteurPhotoUri?: string;
  titre: string;
  contenu: string;
  date: string; // ISO datetime
  commentaires: ForumComment[];
}
