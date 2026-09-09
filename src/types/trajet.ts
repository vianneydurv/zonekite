export interface Trajet {
  id: string;
  spotId: string;
  // Optionnel : absent sur les trajets créés avant l'introduction du champ.
  // Sert à vérifier côté règles Firestore que seul le conducteur peut
  // modifier son trajet (ex. décompte des places à l'acceptation d'une
  // demande).
  conducteurUid?: string;
  conducteurPrenom: string;
  conducteurPhotoUri?: string;
  date: string; // ISO yyyy-mm-dd
  heureDepart: string; // ex "10h"
  heureRetourEstimee?: string;
  adresseDepart: string;
  adresseDepartDetail?: string; // précision (ex: "Parking Auchan, niveau 1")
  vehicule?: string; // ex: "Berline · remorque possible"
  placesDispo: number;
  placesTotal?: number; // par défaut = placesDispo
  materielMax?: string; // ex: "2 kites max"
  // Prénoms déjà à bord, à titre indicatif (démo — pas de vrais passagers
  // tant que les réservations ne sont pas branchées sur Firebase).
  dejaABord?: string[];
}
