import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { territoryService, TERRITORIES_KEY } from '../services/territoryService';
import { territoriesFetcher } from '../services/firestoreFetcher';
import { auth } from '../config/firebase';
import { Territory } from '~/types/Territory';
import { MapPressEvent } from 'react-native-maps';
import { useOfflineSWR } from './useOfflineSWR';
import { getTerritoryStatus } from '~/utils/territoryStatus';
import { territoryUtils } from '~/utils/territoryUtils';

// 🔑 Variable global para rastrear si la sincronización inicial ya ocurrió
let hasInitializedSync = false;

export const useTerritory = (options?: { revalidateOnFocus?: boolean }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [drawingCoordinates, setDrawingCoordinates] = useState<any[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const isSyncingRef = useRef(false);

  const {
    data: territories = [],
    error,
    isLoading,
    mutate: mutateTerritories,
  } = useOfflineSWR<Territory[]>(TERRITORIES_KEY, territoriesFetcher, {
    revalidateOnFocus: options?.revalidateOnFocus ?? true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
    ttl: 1000 * 60 * 60 * 24, // 24h
  });

  useEffect(() => {
    setDrawingCoordinates([]);
  }, [isEditMode]);

  useEffect(() => {
    // ⚡ Solo sincronizar una vez al inicio de la app
    if (hasInitializedSync || isSyncingRef.current) {
      console.log('⏭️ [useTerritory] Sincronización ya en progreso o completada, saltando...');
      return;
    }

    isSyncingRef.current = true;

    (async () => {
      console.log('🗺️ [useTerritory] Iniciando carga INICIAL de territorios...');
      try {
        const local = await territoryService.getLocalTerritories();
        console.log(`📦 [LocalDB] ${local.length} territorios cargados desde almacenamiento local`);
        mutateTerritories(local, false);

        console.log('🌐 [Sync] Intentando sincronizar territorios desde Firestore...');
        const synced = await territoryService.syncAll();
        console.log(`✅ [Sync] ${synced.length} territorios sincronizados desde Firestore`);
        mutateTerritories(synced, false);
        
        hasInitializedSync = true;
      } catch (error) {
        console.error('❌ [useTerritory] Error en sincronización inicial:', error);
        // No resetear hasInitializedSync, para evitar reintentos infinitos
      } finally {
        isSyncingRef.current = false;
      }
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

  const filteredAndMappedTerritories = useMemo(() => {
    let filtered = territoriesWithStatus;
    
    // Aplicar filtro por estado si está seleccionado
    if (selectedFilter) {
      filtered = filtered.filter((t) => t.status === selectedFilter);
    }
    
    return filtered;
  }, [territoriesWithStatus, selectedFilter]);

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

  const restartTerritory = useCallback(
    async (id: string) => {
      try {
        console.log(`🔄 [restartTerritory] Reiniciando territorio ${id}...`);
        await updateTerritory(id, {
          visitStartDate: '',
          visitEndDate: '',
          note: '',
        });
        console.log('✅ [restartTerritory] Territorio reiniciado');
      } catch (error) {
        console.error('❌ [restartTerritory] Error:', error);
        alert('Error al reiniciar el territorio.');
      }
    },
    [updateTerritory]
  );

  return {
    assignToGroup,
    unassignFromGroup,
    restartTerritory,
    territories,
    filteredTerritories: filteredAndMappedTerritories,
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

// 🔄 Función para resetear la sincronización (útil al cambiar de usuario)
export const resetTerritorySync = () => {
  hasInitializedSync = false;
  console.log('🔄 [resetTerritorySync] Sincronización reseteada');
};
