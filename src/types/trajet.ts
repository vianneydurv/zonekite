export interface Trajet {
  id: string;
  spotId: string;
  conducteurPrenom: string;
  conducteurPhotoUri?: string;
  date: string; // ISO yyyy-mm-dd
  heureDepart: string; // ex "10h"
  heureRetourEstimee?: string;
  adresseDepart: string;
  placesDispo: number;
}
