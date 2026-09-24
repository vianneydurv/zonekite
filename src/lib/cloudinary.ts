// Hébergement des photos de profil via Cloudinary (plan gratuit, pas de
// backend à gérer). Le cloud name et l'upload preset sont publics par
// conception (upload "unsigned") — pas des secrets, comme la clé API
// Firebase déjà présente dans firebase.ts.
const CLOUDINARY_CLOUD_NAME = 'qzqkgqnd';
const CLOUDINARY_UPLOAD_PRESET = 'ZoneKite_Profil';

// Envoie une image locale (uri file://…) sur Cloudinary et renvoie son URL
// publique https:// stable, valable pour tous les utilisateurs.
export async function uploadProfilePhoto(localUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  } as unknown as Blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!response.ok) throw new Error(`Échec de l'upload Cloudinary (${response.status})`);
  const json = await response.json();
  return json.secure_url as string;
}

// Les profils créés avant Cloudinary gardent une uri locale (file://…),
// illisible sur un autre appareil ou après réinstallation de l'app : seule
// une URL https:// est affichable pour tout le monde.
export function isRemotePhoto(uri: string | null | undefined): uri is string {
  return typeof uri === 'string' && uri.startsWith('https://');
}
