import { useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import MapView, { Region } from 'react-native-maps';
import { Territory } from '~/types/Territory';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a la ubicación');
      return;
    }

    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation);

    mapRef.current?.animateToRegion(
      {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  };

  const focusOnTerritory = (territory: Territory) => {
    if (!territory?.coordinates || territory.coordinates.length === 0) return;

    const lats = territory.coordinates.map((coord) => coord.latitude);
    const lngs = territory.coordinates.map((coord) => coord.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    let midLat = (minLat + maxLat) / 2;
    let midLng = (minLng + maxLng) / 2;

    const latDelta = Math.max(maxLat - minLat, 0.01);
    const lngDelta = Math.max(maxLng - minLng, 0.01);

    // 🔥 Ajuste: mueve el centro un poco hacia arriba
    // mientras más grande sea el delta, más movemos
    const offset = latDelta * 0.25; // 25% hacia arriba
    midLat = midLat - offset;

    mapRef.current?.animateToRegion(
      {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      },
      500
    );
  };

  // 🔍 Calcular si un territorio está dentro del viewport actual
  const getTerritoriesInViewport = useCallback(
    (territories: Territory[]): Territory[] => {
      if (!mapRegion) return territories;

      const latDelta = mapRegion.latitudeDelta;
      const lngDelta = mapRegion.longitudeDelta;

      // Buffer: mostrar territorios un poco fuera de pantalla también
      const latBuffer = latDelta * 0.3;
      const lngBuffer = lngDelta * 0.3;

      const minLat = mapRegion.latitude - latDelta / 2 - latBuffer;
      const maxLat = mapRegion.latitude + latDelta / 2 + latBuffer;
      const minLng = mapRegion.longitude - lngDelta / 2 - lngBuffer;
      const maxLng = mapRegion.longitude + lngDelta / 2 + lngBuffer;

      return territories.filter((territory) => {
        if (!territory?.coordinates?.length) return false;

        // Verificar si ALGUNA coordenada está en el viewport
        const inBounds = territory.coordinates.some((coord) => {
          const latOk = coord.latitude >= minLat && coord.latitude <= maxLat;
          const lonOk = coord.longitude >= minLng && coord.longitude <= maxLng;
          return latOk && lonOk;
        });

        return inBounds;
      });
    },
    [mapRegion]
  );

  const handleRegionChange = useCallback((region: Region) => {
    setMapRegion(region);
  }, []);

  return {
    location,
    setLocation,
    mapRef,
    mapRegion,
    setMapRef: (ref: MapView) => {
      mapRef.current = ref;
    },
    getLocation,
    focusOnTerritory,
    getTerritoriesInViewport,
    handleRegionChange,
  };
};
