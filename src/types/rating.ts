export interface SpotRating {
  uid: string;
  value: number; // 1 à 5
  comment?: string;
  date: string; // ISO datetime
}
