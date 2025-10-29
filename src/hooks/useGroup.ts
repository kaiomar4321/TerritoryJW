// useGroup.ts
import { useCallback, useEffect } from 'react';
import { groupService, GROUPS_KEY } from '~/services/groupService';
import { useOfflineSWR } from './useOfflineSWR';
import { Group } from '~/types/Group';

export const useGroup = () => {
  const { data: groups = [], isLoading, mutate } = useOfflineSWR<Group[]>(
    GROUPS_KEY, 
    groupService.getAll
  );

  useEffect(() => {
    (async () => {
      const local = await groupService.getLocalGroups();
      mutate(local, false);
      await groupService.syncAll();
      mutate(); // Revalidar después de sincronizar
    })();
  }, [mutate]);

  const createGroup = useCallback(
    async (number: number, leaderId: string, territoryIds: string[]) => {
      const newGroup = await groupService.saveGroup({ number, leaderId, territoryIds });
      await mutate();
      return newGroup;
    },
    [mutate]
  );

  const updateGroup = useCallback(
    async (id: string, updates: Partial<Group>) => {
      await groupService.updateGroup(id, updates);
      await mutate();
    },
    [mutate]
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      await groupService.deleteGroup(id);
      await mutate();
    },
    [mutate]
  );

  return {
    groups,
    isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
  };
};