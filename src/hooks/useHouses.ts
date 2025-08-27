import { useState, useEffect, useCallback } from 'react';
import { LatLng } from 'react-native-maps';
import useSWR from 'swr';
import { houseService, House, getHousesKey } from '../services/houseService';
import { housesFetcher } from '../services/firestoreFetcher';
import { auth } from '../config/firebase';

export const useHouses = (territoryId: string | null) => {
  // Estados originales mantenidos
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [isAddingHouse, setIsAddingHouse] = useState(false);
  const [currentHouseLocation, setCurrentHouseLocation] = useState<LatLng | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Usar SWR para obtener houses
  const { 
    data: houses = [], 
    error, 
    isLoading,
    mutate: mutateHouses
  } = useSWR<House[]>(
    getHousesKey(territoryId), // null si no hay territoryId, lo que deshabilitará SWR
    housesFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      errorRetryCount: 3,
    }
  );

  // Habilitar actualizaciones en tiempo real cuando hay territoryId
  useEffect(() => {
    if (!territoryId) {
      setIsSubscribed(false);
      return;
    }

    const unsubscribe = houseService.subscribeToHousesByTerritory(territoryId, (newHouses) => {
      // Los datos se actualizarán automáticamente en SWR a través del mutate en subscribeToHousesByTerritory
    });

    setIsSubscribed(true);

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [territoryId]);

  // Función para agregar house
  const addHouse = useCallback(async (
    address: string,
    reason: string = '',
    coordinates: { latitude: number; longitude: number }
  ) => {
    if (!territoryId || !auth.currentUser) {
      throw new Error('No hay territorio seleccionado o usuario no autenticado');
    }

    try {
      await houseService.addHouse(territoryId, address, reason, auth.currentUser.uid, coordinates);
      // SWR se actualizará automáticamente gracias al mutate en houseService
    } catch (error) {
      console.error('Error adding house:', error);
      throw error;
    }
  }, [territoryId]);

  // Función para actualizar house
  const updateHouse = useCallback(async (
    houseId: string,
    updates: {
      address?: string;
      reason?: string;
      coordinates?: { latitude: number; longitude: number };
    }
  ) => {
    try {
      await houseService.updateHouse(houseId, updates);
      // SWR se actualizará automáticamente gracias al mutate en houseService
    } catch (error) {
      console.error('Error updating house:', error);
      throw error;
    }
  }, []);

  // Función para eliminar house
  const deleteHouse = useCallback(async (houseId: string) => {
    try {
      await houseService.deleteHouse(houseId);
      // SWR se actualizará automáticamente gracias al mutate en houseService
    } catch (error) {
      console.error('Error deleting house:', error);
      throw error;
    }
  }, []);

  // Función para manejar el estado de agregar house
  const handleAddingHouse = useCallback((isAdding: boolean, fallbackLocation?: LatLng) => {
    setIsAddingHouse(isAdding);
    if (isAdding) {
      setCurrentHouseLocation(fallbackLocation ?? null);
    } else {
      setCurrentHouseLocation(null);
    }
  }, []);

  // Función para refrescar manualmente
  const refreshHouses = useCallback(() => {
    if (territoryId) {
      return mutateHouses();
    }
  }, [mutateHouses, territoryId]);

  return {
    // Datos
    houses,
    loading: isLoading, // Mantener la prop original para compatibilidad
    isLoading, // Nueva prop más estándar
    error,
    
    // Estados de UI
    selectedHouse,
    setSelectedHouse,
    isAddingHouse,
    currentHouseLocation,
    setCurrentHouseLocation,
    isSubscribed,
    
    // Funciones
    addHouse,
    updateHouse,
    deleteHouse,
    handleAddingHouse,
    refreshHouses,
  };
};