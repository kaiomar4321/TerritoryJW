import { useState, useEffect, useMemo, useCallback } from 'react';
import { territoryService, TERRITORIES_KEY } from '../services/territoryService';
import { territoriesFetcher } from '../services/firestoreFetcher';
import { auth } from '../config/firebase';
import { Territory } from '~/types/Territory';
import { MapPressEvent } from 'react-native-maps';
import { useOfflineSWR } from './useOfflineSWR'; // 👈 nuevo hook
import { getTerritoryStatus } from '~/utils/territoryStatus';
import { territoryUtils } from '~/utils/territoryUtils';

export const useTerritory = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [drawingCoordinates, setDrawingCoordinates] = useState<any[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Estados locales para operaciones batch
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  const {
    data: territories = [],
    error,
    isLoading,
    mutate: mutateTerritories,
  } = useOfflineSWR<Territory[]>(TERRITORIES_KEY, territoriesFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
    ttl: 1000 * 60 * 60 * 24, // 24 horas
  });

  useEffect(() => {
    setDrawingCoordinates([]);
  }, [isEditMode]);

  useEffect(() => {
    (async () => {
      // cargar local siempre primero
      const local = await territoryService.getLocalTerritories();
      mutateTerritories(local, false);

      // luego intentar sync si hay internet
      await territoryService.syncAll();
    })();
  }, []);

  const saveTerritory = useCallback(async () => {
    if (drawingCoordinates.length >= 3) {
      if (auth.currentUser) {
        try {
          await territoryService.saveTerritory(drawingCoordinates, auth.currentUser.uid);
          setDrawingCoordinates([]);
          setIsEditMode(false);
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

  const allReady = useMemo(() => territoryUtils.areAllReady(territories), [territories]);

  const allCompleted = useMemo(() => territoryUtils.areAllCompleted(territories), [territories]);

  const markAllReady = async () => {
    try {
      setIsBatchLoading(true);
      setBatchError(null);
      await territoryService.markAllAsReady(territories);
      await refreshTerritories();
    } catch (error) {
      console.error('Error al marcar como listos:', error);
      setBatchError('No se pudieron marcar los territorios como listos');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const markAllCompleted = async () => {
    try {
      setIsBatchLoading(true);
      setBatchError(null);
      await territoryService.markAllAsCompleted(territories);
      await refreshTerritories();
    } catch (error) {
      console.error('Error al marcar como completados:', error);
      setBatchError('No se pudieron marcar los territorios como completados');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const territoriesWithStatus = useMemo(() => {
    return territories.map((t) => ({
      ...t,
      status: getTerritoryStatus(t).id,
    }));
  }, [territories]);

  const updateTerritory = useCallback(
    async (id: string, updates: Partial<Territory>) => {
      try {
        await mutateTerritories(
          async (current) => {
            // 🔹 actualiza localmente
            if (!current) return current;
            const newData = current.map((t) => (t.id === id ? { ...t, ...updates } : t));
            // 🔹 dispara update en Firestore
            await territoryService.updateTerritory(id, updates);
            return newData;
          },
          { revalidate: false } // 👈 evita doble request inmediato
        );
        setSelectedTerritory(null);
      } catch (error) {
        alert('Error al actualizar el territorio.');
        console.log(error);
      }
    },
    [mutateTerritories]
  );

  const deleteTerritory = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        // 🔹 eliminar localmente con mutate
        await mutateTerritories(
          async (current) => {
            if (!current) return current;
            const newData = current.filter((t) => t.id !== id);
            return newData;
          },
          { revalidate: false } // evitar re-fetch inmediato
        );

        // 🔹 eliminar en Firestore
        await territoryService.deleteTerritory(id);

        // 🔹 limpiar selección si era el eliminado
        if (selectedTerritory?.id === id) {
          setSelectedTerritory(null);
        }
      } catch (error) {
        console.error('Error eliminando el territorio:', error);
        alert('No se pudo eliminar el territorio.');
      }
    },
    [mutateTerritories, selectedTerritory]
  );

  const handleMapPress = useCallback(
    (event: MapPressEvent, isAdmin: boolean) => {
      if (isEditMode && isAdmin && auth.currentUser) {
        const coordinate = event.nativeEvent.coordinate;
        if (coordinate?.latitude && coordinate?.longitude) {
          setDrawingCoordinates((prev) => [...prev, coordinate]);
        }
      }
    },
    [isEditMode]
  );

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

  const filteredTerritories = useMemo(() => {
    if (!selectedFilter) return territoriesWithStatus;
    return territoriesWithStatus.filter((t) => t.status === selectedFilter);
  }, [territoriesWithStatus, selectedFilter]);

  const refreshTerritories = useCallback(() => {
    return mutateTerritories();
  }, [mutateTerritories]);

  const assignToGroup = useCallback(
    async (territoryId: string, groupId: string) => {
      await updateTerritory(territoryId, { groupId });
    },
    [updateTerritory]
  );

  const unassignFromGroup = useCallback(
    async (territoryId: string) => {
      await updateTerritory(territoryId, { groupId: null });
    },
    [updateTerritory]
  );

  return {
    assignToGroup,
    unassignFromGroup,
    territories,
    filteredTerritories,
    isLoading, // del useOfflineSWR
    error, // del useOfflineSWR
    isBatchLoading, // para operaciones batch
    batchError, // para errores de operaciones batch
    isEditMode,
    setIsEditMode,
    drawingCoordinates,
    setDrawingCoordinates,
    selectedTerritory,
    setSelectedTerritory,
    selectedFilter,
    setSelectedFilter,
    isSubscribed,
    saveTerritory,
    updateTerritory,
    handleMapPress,
    onNoteChange,
    refreshTerritories,
    allReady,
    allCompleted,
    markAllReady,
    markAllCompleted,
    deleteTerritory,
  };
};
