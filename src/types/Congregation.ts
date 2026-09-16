// types/Congregation.ts
export interface Congregation {
  id: string;
  name: string;
  createdBy: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
}
