// ~/utils/territoryUtils.js
import { Territory } from '~/types/Territory';
import { getTerritoryStatus } from './territoryStatus';
export const territoryUtils = {
  // Verificar si todos los territorios están listos
  areAllReady: (territories: Territory[]) => {
    return territories.length > 0 && territories.every((t) => getTerritoryStatus(t).id === 'ready');
  },

  // Verificar si todos están completados
  areAllCompleted: (territories: Territory[]) => {
    return (
      territories.length > 0 && territories.every((t) => getTerritoryStatus(t).id === 'completed')
    );
  },

  // Preparar datos para marcar como listo
  prepareReadyUpdates: (territories: Territory[]) => {
    return territories.map((t) => ({
      id: t.id,
      visitStartDate: null,
      visitEndDate: null,
    }));
  },

  // Preparar datos para marcar como completado
  prepareCompletedUpdates: (territories: Territory[]) => {
    const now = new Date().toISOString();
    return territories.map((t) => ({
      id: t.id,
      visitStartDate: t.visitStartDate ?? now,
      visitEndDate: now,
    }));
  },
};
