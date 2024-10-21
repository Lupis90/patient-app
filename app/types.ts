export interface Photo {
  name: string;
  type: string;
  data: string;
}

export interface Visit {
  id?: number;
  patient_id: number;
  date: string;
  photos: Photo[];
}

export interface Patient {
  id?: number;
  first_name: string;
  last_name: string;
  visits: Visit[];
}
