export type RideRequestStatus = 'pending' | 'accepted' | 'refused';

export interface RideRequest {
  id: string;
  tripId: string;
  passagerUid: string;
  passagerPrenom: string;
  passagerPhotoUri?: string;
  status: RideRequestStatus;
  date: string; // ISO datetime de la demande
}
