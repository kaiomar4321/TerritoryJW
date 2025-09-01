// mapUtils.ts
import { Coordinate, Territory } from '~/types/Territory';
import { getTerritoryStatus } from './territoryStatus';
import { FILTER_OPTIONS } from '~/types/FilterOption';
// Asignamos colores según el estado


export const getPolygonCenter = (coordinates: Coordinate[]): Coordinate => {
  if (!coordinates || coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }
  const latitudes = coordinates.map((c) => c.latitude);
  const longitudes = coordinates.map((c) => c.longitude);

  const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
  const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

  return { latitude: avgLat, longitude: avgLng };
};
