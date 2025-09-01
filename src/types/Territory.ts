export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Territory = {
  id: string;
  name: string;
  createdBy: string;
  coordinates: Coordinate[];
  color: string;
  createdAt: any,
  number: number,
  visitStartDate?: string | null; 
  visitEndDate?: string | null;
  note?: string;
};
