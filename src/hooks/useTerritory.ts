import { useState, useEffect, useMemo, useCallback } from 'react';
import { territoryService, TERRITORIES_KEY } from '../services/territoryService';
import { territoriesFetcher } from '../services/firestoreFetcher';
import { auth } from '../config/firebase';
import { Territory } from '~/types/Territory';
import { MapPressEvent } from 'react-native-maps';
import { useOfflineSWR } from './useOfflineSWR';
import { getTerritoryStatus } from '~/utils/territoryStatus';
import { territoryUtils } from '~/utils/territoryUtils';

export const useTerritory = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [drawingCoordinates, setDrawingCoordinates] = useState<any[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
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
    ttl: 1000 * 60 * 60 * 24, // 24h
  });

  useEffect(() => {
    setDrawingCoordinates([]);
  }, [isEditMode]);

  useEffect(() => {
    (async () => {
      console.log('🗺️ [useTerritory] Iniciando carga de territorios...');
      const local = await territoryService.getLocalTerritories();
      console.log(`📦 [LocalDB] ${local.length} territorios cargados desde almacenamiento local`);
      mutateTerritories(local, false);

      console.log('🌐 [Sync] Intentando sincronizar territorios desde Firestore...');
      const synced = await territoryService.syncAll();
      console.log(`✅ [Sync] ${synced.length} territorios sincronizados desde Firestore`);
      mutateTerritories(synced, false);
    })();
  }, [mutateTerritories]);

  const saveTerritory = useCallback(async () => {
    if (drawingCoordinates.length < 3) {
      alert('Se necesitan al menos 3 puntos para crear un territorio');
      return;
    }
    if (!auth.currentUser) {
      alert('Usuario no autenticado.');
      return;
    }

    try {
      console.log('📝 [saveTerritory] Guardando nuevo territorio...');
      await territoryService.saveTerritory(drawingCoordinates, auth.currentUser.uid);
      console.log('✅ [saveTerritory] Territorio guardado correctamente');
      setDrawingCoordinates([]);
      setIsEditMode(false);
    } catch (error) {
      console.error('❌ [saveTerritory] Error:', error);
      alert('Error al guardar el territorio.');
    }
  }, [drawingCoordinates]);

  const allReady = useMemo(() => territoryUtils.areAllReady(territories), [territories]);
  const allCompleted = useMemo(() => territoryUtils.areAllCompleted(territories), [territories]);

  const markAllReady = async () => {
    try {
      console.log('⚙️ [markAllReady] Marcando todos los territorios como listos...');
      setIsBatchLoading(true);
      setBatchError(null);
      await territoryService.markAllAsReady(territories);
      await refreshTerritories();
      console.log('✅ [markAllReady] Todos marcados como listos.');
    } catch (error) {
      console.error('❌ [markAllReady] Error:', error);
      setBatchError('No se pudieron marcar los territorios como listos');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const markAllCompleted = async () => {
    try {
      console.log('⚙️ [markAllCompleted] Marcando todos como completados...');
      setIsBatchLoading(true);
      setBatchError(null);
      await territoryService.markAllAsCompleted(territories);
      await refreshTerritories();
      console.log('✅ [markAllCompleted] Todos marcados como completados.');
    } catch (error) {
      console.error('❌ [markAllCompleted] Error:', error);
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
        console.log(`📝 [updateTerritory] Actualizando territorio ${id}...`);
        await mutateTerritories(
          async (current) => {
            if (!current) return current;
            const newData = current.map((t) => (t.id === id ? { ...t, ...updates } : t));
            await territoryService.updateTerritory(id, updates);
            return newData;
          },
          { revalidate: false }
        );
        console.log('✅ [updateTerritory] Territorio actualizado');
        setSelectedTerritory(null);
      } catch (error) {
        console.error('❌ [updateTerritory] Error:', error);
        alert('Error al actualizar el territorio.');
      }
    },
    [mutateTerritories]
  );

  const deleteTerritory = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        console.log(`🗑️ [deleteTerritory] Eliminando territorio ${id}...`);
        await mutateTerritories(
          async (current) => current?.filter((t) => t.id !== id),
          { revalidate: false }
        );
        await territoryService.deleteTerritory(id);
        console.log('✅ [deleteTerritory] Territorio eliminado');
        if (selectedTerritory?.id === id) setSelectedTerritory(null);
      } catch (error) {
        console.error('❌ [deleteTerritory] Error:', error);
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
          console.log('📍 [handleMapPress] Punto agregado:', coordinate);
        }
      }
    },
    [isEditMode]
  );

  const refreshTerritories = useCallback(async () => {
    console.log('🔄 [refreshTerritories] Actualizando datos...');
    await mutateTerritories();
  }, [mutateTerritories]);

  const assignToGroup = useCallback(
    async (territoryId: string, groupId: string) => {
      console.log(`👥 [assignToGroup] Asignando territorio ${territoryId} al grupo ${groupId}`);
      await updateTerritory(territoryId, { groupId });
    },
    [updateTerritory]
  );

  const unassignFromGroup = useCallback(
    async (territoryId: string) => {
      console.log(`🚫 [unassignFromGroup] Quitando grupo del territorio ${territoryId}`);
      await updateTerritory(territoryId, { groupId: null });
    },
    [updateTerritory]
  );

  return {
    assignToGroup,
    unassignFromGroup,
    territories,
    filteredTerritories: territoriesWithStatus,
    isLoading,
    error,
    isBatchLoading,
    batchError,
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
    refreshTerritories,
    allReady,
    allCompleted,
    markAllReady,
    markAllCompleted,
    deleteTerritory,
  };
};
