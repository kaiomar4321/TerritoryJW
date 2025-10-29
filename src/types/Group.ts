// types/Group.ts
export interface Group {
  id: string;
  number: number;
  leaderId: string; // UID del encargado
  leaderName?: string;
  territoryIds: string[]; // IDs de territorios asignados
  createdAt: string;
  updatedAt: string;
}
