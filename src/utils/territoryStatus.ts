import { FILTER_OPTIONS } from '~/types/FilterOption';
import { Territory } from '~/types/Territory';

export type TerritoryStatus = (typeof FILTER_OPTIONS)[number]['id'];
export type TerritoryStatusOption = (typeof FILTER_OPTIONS)[number];

export const getTerritoryStatus = (territory: Territory): TerritoryStatusOption => {
  let status: TerritoryStatus = 'ready';

  if (!territory.visitStartDate && !territory.visitEndDate) {
    status = 'ready';
  } else if (territory.visitStartDate && !territory.visitEndDate) {
    status = 'incomplete';
  } else if (territory.visitStartDate && territory.visitEndDate) {
    status = 'completed';
  }

  // Busca el objeto completo en FILTER_OPTIONS
  const option = FILTER_OPTIONS.find((opt) => opt.id === status);

  // Nunca debería ser undefined, pero por seguridad
  return option ?? FILTER_OPTIONS[0];
};

export const getTerritoryStats = (territories: Territory[]) => {
  // Inicializar counts con todos los ids de FILTER_OPTIONS en 0
  const counts = FILTER_OPTIONS.reduce(
    (acc, opt) => ({ ...acc, [opt.id]: 0 }),
    {} as Record<(typeof FILTER_OPTIONS)[number]['id'], number>
  );

  territories.forEach((t) => {
    const status = getTerritoryStatus(t); // devuelve { id, label, colorHex, icon }
    counts[status.id] += 1;
  });

  return counts;
};
