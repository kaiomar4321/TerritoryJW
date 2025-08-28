import { useState, useEffect, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { territoryService, TERRITORIES_KEY } from '../services/territoryService';
import { territoriesFetcher } from '../services/firestoreFetcher';
import { auth } from '../config/firebase';
import { Territory } from '~/types/Territory';
import { MapPressEvent } from "react-native-maps";

export const useTerritory = () => {
  // Estados originales mantenidos
  const [isEditMode, setIsEditMode] = useState(false);
  const [drawingCoordinates, setDrawingCoordinates] = useState<any[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Usar SWR para obtener territorios con territoriesFetcher
  const {
    data: territories = [],
    error,
    isLoading,
    mutate: mutateTerritories,
  } = useSWR<Territory[]>(TERRITORIES_KEY, territoriesFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
  });

  // Limpiar coordenadas de dibujo cuando cambia el modo de edición
  useEffect(() => {
    setDrawingCoordinates([]);
  }, [isEditMode]);

  // Habilitar actualizaciones en tiempo real automáticamente
  useEffect(() => {
    const unsubscribe = territoryService.subscribeToTerritories((newTerritories) => {
      // Los datos se actualizarán automáticamente en SWR a través del mutate en subscribeToTerritories
    });

    setIsSubscribed(true);

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, []);

  // Función para guardar territorio (adaptada)
  const saveTerritory = useCallback(async () => {
    if (drawingCoordinates.length >= 3) {
      if (auth.currentUser) {
        try {
          await territoryService.saveTerritory(drawingCoordinates, auth.currentUser.uid);
          setDrawingCoordinates([]);
          setIsEditMode(false);
          // SWR se actualizará automáticamente gracias al mutate en territoryService
        } catch (error) {
          console.error('Error saving territory:', error);
          alert('Error al guardar el territorio.');
        }
      } else {
        alert('Usuario no autenticado. No se puede guardar el territorio.');
      }
    } else {
      alert('Se necesitan al menos 3 puntos para crear un territorio');
    }
  }, [drawingCoordinates]);

  // Función para actualizar territorio
  const updateTerritory = useCallback(async (id: string, updates: Partial<Territory>) => {
    try {
      await territoryService.updateTerritory(id, updates);
      setSelectedTerritory(null); // opcional: cerrar vista después de editar
      // SWR se actualizará automáticamente gracias al mutate en territoryService
    } catch (error) {
      alert('Error al actualizar el territorio.');
      console.log(error);
    }
  }, []);

  // Función para manejar press en el mapa
 const handleMapPress = useCallback(
  (event: MapPressEvent, isAdmin: boolean) => {
    if (isEditMode && isAdmin && auth.currentUser) {
      const coordinate = event.nativeEvent.coordinate; // 👈 aquí sacas la coordenada
      if (coordinate?.latitude && coordinate?.longitude) {
        setDrawingCoordinates((prev) => [...prev, coordinate]);
      }
    }
  },
  [isEditMode]
);
  // Función para cambiar nota
  const onNoteChange = useCallback(
    async (note: string) => {
      if (!selectedTerritory) return;

      try {
        await updateTerritory(selectedTerritory.id, { note });
      } catch (error) {
        console.error('Error actualizando la nota del territorio:', error);
      }
    },
    [selectedTerritory, updateTerritory]
  );

  // Territorios filtrados (usando memo)
  const filteredTerritories = useMemo(() => {
    if (!selectedFilter) return territories;

    if (selectedFilter === 'active') {
      return territories.filter((t) => t.visitStartDate && !t.visitEndDate);
    }
    if (selectedFilter === 'completed') {
      return territories.filter((t) => t.visitEndDate);
    }
    return territories;
  }, [territories, selectedFilter]);

  // Función para refrescar manualmente
  const refreshTerritories = useCallback(() => {
    return mutateTerritories();
  }, [mutateTerritories]);

  return {
    // Datos
    territories,
    filteredTerritories,
    isLoading,
    error,

    // Estados de UI
    isEditMode,
    setIsEditMode,
    drawingCoordinates,
    setDrawingCoordinates,
    selectedTerritory,
    setSelectedTerritory,
    selectedFilter,
    setSelectedFilter,
    isSubscribed,

    // Funciones
    saveTerritory,
    updateTerritory,
    handleMapPress,
    onNoteChange,
    refreshTerritories,
  };
};
