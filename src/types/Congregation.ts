// types/Congregation.ts
export interface Congregation {
  id: string;
  name: string;
  createdBy: string;
  location?: string;
  city?: string; // ciudad o municipio
  state?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
}
