// Photos locales des spots (require statique obligatoire pour Metro).
// Une entrée par spot id — voir src/data/spots.ts. Chaque photo doit être
// celle de Spot.photoUrl (Wikimedia Commons, licence libre), créditée dans
// l'app : le script scripts/fetch-spot-photos.mjs les télécharge et
// régénère ce fichier. Un spot sans photo affiche un fond neutre.
export const spotPhotos: Record<string, number> = {
  wissant: require('../../assets/spots/wissant.jpg'),
  sangatte: require('../../assets/spots/sangatte.jpg'),
  'berck-plage': require('../../assets/spots/berck-plage.jpg'),
  'merville-franceville-plage': require('../../assets/spots/merville-franceville-plage.jpg'),
  'siouville-hague': require('../../assets/spots/siouville-hague.jpg'),
  'saint-aubin-sur-mer': require('../../assets/spots/saint-aubin-sur-mer.jpg'),
  'vierville-sur-mer': require('../../assets/spots/vierville-sur-mer.jpg'),
  'colleville-montgomery': require('../../assets/spots/colleville-montgomery.jpg'),
  'kerhilio-erdeven': require('../../assets/spots/kerhilio-erdeven.jpg'),
  'les-sables-blancs-quiberon': require('../../assets/spots/les-sables-blancs-quiberon.jpg'),
  'keremma-treflez': require('../../assets/spots/keremma-treflez.jpg'),
  'baie-du-kernic-plouescat': require('../../assets/spots/baie-du-kernic-plouescat.jpg'),
  'la-torche-plomeur': require('../../assets/spots/la-torche-plomeur.jpg'),
  'saint-michel-en-greve': require('../../assets/spots/saint-michel-en-greve.jpg'),
  'fort-bloque-guidel-ploemeur': require('../../assets/spots/fort-bloque-guidel-ploemeur.jpg'),
  'petite-mer-de-gavres': require('../../assets/spots/petite-mer-de-gavres.jpg'),
  'landrezac-sarzeau': require('../../assets/spots/landrezac-sarzeau.jpg'),
  'penvins-sarzeau': require('../../assets/spots/penvins-sarzeau.jpg'),
  'la-tranche-sur-mer-plage-du-phare': require('../../assets/spots/la-tranche-sur-mer-plage-du-phare.jpg'),
  'le-veillon-talmont-saint-hilaire': require('../../assets/spots/le-veillon-talmont-saint-hilaire.jpg'),
  'plage-des-dunes-sables-dolonne': require('../../assets/spots/plage-des-dunes-sables-dolonne.jpg'),
  'fromentine-la-barre-de-monts': require('../../assets/spots/fromentine-la-barre-de-monts.jpg'),
  'barbatre-noirmoutier': require('../../assets/spots/barbatre-noirmoutier.jpg'),
  'chatelaillon-plage': require('../../assets/spots/chatelaillon-plage.jpg'),
  'le-boutillon-ile-de-re': require('../../assets/spots/le-boutillon-ile-de-re.jpg'),
  'plage-des-seulieres-oleron': require('../../assets/spots/plage-des-seulieres-oleron.jpg'),
  'la-hume-gujan-mestras': require('../../assets/spots/la-hume-gujan-mestras.jpg'),
  'lacanau-ocean': require('../../assets/spots/lacanau-ocean.jpg'),
  'les-estagnots-seignosse': require('../../assets/spots/les-estagnots-seignosse.jpg'),
  'la-madrague-anglet': require('../../assets/spots/la-madrague-anglet.jpg'),
  hendaye: require('../../assets/spots/hendaye.jpg'),
};
