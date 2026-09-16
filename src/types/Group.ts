// types/Group.ts
export interface Group {
  id: string;
  number: number;
  congregationId: string;
  leaderId: string; // UID del encargado
  territoryIds: string[]; // IDs de territorios asignados
  createdAt: string;
  updatedAt: string;
}
