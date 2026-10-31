// Page Wikimedia Commons d'une photo (auteur et licence), à partir de son
// URL de fichier : .../commons/4/43/Wissant_-_Plage.jpg → File:Wissant_-_Plage.jpg
export function commonsPageUrl(photoUrl: string): string {
  const file = photoUrl.split('/').pop() ?? '';
  return `https://commons.wikimedia.org/wiki/File:${file}`;
}
