import { useEffect, useCallback, useRef } from 'react';
import { groupService, GROUPS_KEY } from '~/services/groupService';
import { useOfflineSWR } from './useOfflineSWR';
import { Group } from '~/types/Group';
import { useTerritory } from './useTerritory';

export const useGroup = () => {
  const { data: groups = [], isLoading, mutate } = useOfflineSWR<Group[]>(
    GROUPS_KEY,
    groupService.getRemoteGroups,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 1000,
      ttl: 1000 * 60 * 60 * 24,
    }
  );
  const {updateTerritory} = useTerritory()

  // 🔹 Evitar ejecuciones múltiples del useEffect
  const hasInitialized = useRef(false);

  // 🔹 Cargar datos locales y sincronizar con remoto (SOLO UNA VEZ)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const load = async () => {
      try {
        console.log('📦 Cargando grupos desde almacenamiento local...');
        const local = await groupService.getLocalGroups();
        console.log(`✅ ${local.length} grupos cargados desde local.`);

        mutate(local, false);

        console.log('🌐 Sincronizando con Firebase...');
        try {
          await groupService.syncAll();
          const updatedGroups = await groupService.getRemoteGroups();
          console.log(`✅ Sincronización completa (${updatedGroups.length} grupos actualizados desde Firebase).`);
          mutate(updatedGroups, false);
        } catch (error) {
          console.log('⚠️ No se pudo sincronizar con Firebase o no hubo cambios.');
        }
      } catch (error) {
        console.error('❌ Error cargando o sincronizando grupos:', error);
      }
    };

    load();
  }, []); // ← Sin dependencias, solo se ejecuta al montar

  // 🔹 Crear grupo
  const createGroup = useCallback(
    async (number: number, leaderId: string, territoryIds: string[]) => {
      console.log('🆕 Creando grupo...', { number, leaderId, territoryIds });
      const newGroup = await groupService.saveGroup({
        number,
        leaderId,
        territoryIds,
        createdAt: new Date().toISOString(),
      });
      console.log('✅ Grupo creado correctamente, actualizando estado...');
      
      // Actualizar inmediatamente el estado local con el nuevo grupo
      mutate([...groups, newGroup], false);
    },
    [groups, mutate]
  );

  // 🔹 Actualizar grupo
  const updateGroup = useCallback(
    async (id: string, updates: Partial<Group>) => {
      console.log(`✏️ Actualizando grupo ${id} con:`, updates);
      await groupService.updateGroup(id, updates);
      console.log('✅ Grupo actualizado, refrescando lista...');
      
      // Actualizar el estado optimistamente
      const updated = groups.map(g => 
        g.id === id ? { ...g, ...updates } : g
      );
      mutate(updated, false);
    },
    [groups, mutate]
  );

  // 🔹 Eliminar grupo
  const deleteGroup = useCallback(
    async (id: string) => {
      console.log(`🗑️ Eliminando grupo ${id}...`);
      await groupService.deleteGroup(id);
      console.log('✅ Grupo eliminado, actualizando lista...');
      
      // Actualizar el estado optimistamente
      const filtered = groups.filter(g => g.id !== id);
      mutate(filtered, false);
    },
    [groups, mutate]
  );

// 🔹 Asignar territorio
const assignTerritory = useCallback(
  async (groupId: string, territoryId: string) => {
    console.log(`📍 Asignando territorio ${territoryId} al grupo ${groupId}...`);
    
    // 1️⃣ Asignar en el grupo
    await groupService.assignTerritory(groupId, territoryId);
    
    // 2️⃣ Actualizar la base de datos del territorio (establecer groupId)
    await updateTerritory(territoryId, { groupId });
    
    console.log('✅ Territorio asignado correctamente en ambas tablas.');
    
    // 3️⃣ Actualizar el estado optimistamente
    const updated = groups.map(g =>
      g.id === groupId && !g.territoryIds.includes(territoryId)
        ? { ...g, territoryIds: [...g.territoryIds, territoryId] }
        : g
    );
    mutate(updated, false);
  },
  [groups, mutate, updateTerritory]
);

// 🔹 Desasignar territorio
const unassignTerritory = useCallback(
  async (groupId: string, territoryId: string) => {
    console.log(`🚫 Quitando territorio ${territoryId} del grupo ${groupId}...`);
    
    // 1️⃣ Quitar del grupo en su servicio
    await groupService.unassignTerritory(groupId, territoryId);
    
    // 2️⃣ Actualizar la base de datos del territorio (quitar groupId)
    await updateTerritory(territoryId, { groupId: null });
    
    console.log('✅ Territorio desasignado correctamente de ambas tablas.');
    
    // 3️⃣ Actualizar el estado optimistamente
    const updated = groups.map(g =>
      g.id === groupId
        ? { ...g, territoryIds: g.territoryIds.filter(id => id !== territoryId) }
        : g
    );
    mutate(updated, false);
  },
  [groups, mutate, updateTerritory] // ⚠️ Agregar updateTerritory a las dependencias
);

  return {
    groups,
    isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    assignTerritory,
    unassignTerritory,
  };
};

