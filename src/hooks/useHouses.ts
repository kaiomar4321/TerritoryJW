import { useState, useEffect, useCallback } from 'react';
import { LatLng } from 'react-native-maps';
import { houseService, House, getHousesKey } from '../services/houseService';
import { housesFetcher } from '../services/firestoreFetcher';
import { auth } from '../config/firebase';
import { useOfflineSWR } from './useOfflineSWR'; // 👈 usamos el hook genérico

export const useHouses = (territoryId: string | null) => {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [isAddingHouse, setIsAddingHouse] = useState(false);
  const [currentHouseLocation, setCurrentHouseLocation] = useState<LatLng | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const {
    data: houses = [],
    error,
    isLoading,
    mutate: mutateHouses,
  } = useOfflineSWR<House[]>(
    territoryId ? getHousesKey(territoryId) : null, // si es null, no corre SWR
    () => housesFetcher(getHousesKey(territoryId)!),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      errorRetryCount: 3,
      ttl: 1000 * 60 * 60 * 24, // 👈 opcional: 24h de cache
    }
  );

  // Suscripción en tiempo real (si hay territoryId)
  useEffect(() => {
    if (!territoryId) {
      setIsSubscribed(false);
      return;
    }

    const unsubscribe = houseService.subscribeToHousesByTerritory(territoryId, () => {});
    setIsSubscribed(true);

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [territoryId]);

  // Agregar casa
  const addHouse = useCallback(
    async (
      address: string,
      reason: string = '',
      coordinates: { latitude: number; longitude: number }
    ) => {
      if (!territoryId || !auth.currentUser) {
        throw new Error('No hay territorio seleccionado o usuario no autenticado');
      }

      try {
        await houseService.addHouse(
          territoryId,
          address,
          reason,
          auth.currentUser.uid,
          coordinates
        );
        // SWR se actualizará con mutate dentro de houseService
      } catch (error) {
        console.error('Error adding house:', error);
        throw error;
      }
    },
    [territoryId]
  );

  // Actualizar casa
  const updateHouse = useCallback(async (houseId: string, updates: Partial<House>) => {
    try {
      await houseService.updateHouse(houseId, updates);
    } catch (error) {
      console.error('Error updating house:', error);
      throw error;
    }
  }, []);

  // Eliminar casa
  const deleteHouse = useCallback(async (houseId: string) => {
    try {
      await houseService.deleteHouse(houseId);
    } catch (error) {
      console.error('Error deleting house:', error);
      throw error;
    }
  }, []);

  // Control de estado al agregar casa
  const handleAddingHouse = useCallback((isAdding: boolean, fallbackLocation?: LatLng) => {
    setIsAddingHouse(isAdding);
    if (isAdding) {
      setCurrentHouseLocation(fallbackLocation ?? null);
    } else {
      setCurrentHouseLocation(null);
    }
  }, []);

  // Refrescar manualmente
  const refreshHouses = useCallback(() => {
    if (territoryId) {
      return mutateHouses();
    }
  }, [mutateHouses, territoryId]);

  return {
    houses,
    loading: isLoading, // compatibilidad
    isLoading,
    error,

    selectedHouse,
    setSelectedHouse,
    isAddingHouse,
    currentHouseLocation,
    setCurrentHouseLocation,
    isSubscribed,

    addHouse,
    updateHouse,
    deleteHouse,
    handleAddingHouse,
    refreshHouses,
  };
};
