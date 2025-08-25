
import { Coordinate, Territory } from '~/types/Territory';

export const getTerritoryColor = (territory: Territory) => {
  if (territory.visitStartDate && territory.visitEndDate) {
    return '#3b82f6'; // Azul = completado
  }
  if (territory.visitStartDate && !territory.visitEndDate) {
    return '#eab308'; // Amarillo = en progreso
  }
  return territory.color; // Color por defecto
};

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
