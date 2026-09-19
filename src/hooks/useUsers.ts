import { useEffect, useCallback } from 'react';
import { useOfflineSWR } from '~/hooks/useOfflineSWR';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/User';
import { getCurrentCongregationId } from '~/services/session';
const USERS_KEY = 'users';
const db = getFirestore();

const fetchCongregationUsers = async (): Promise<User[]> => {
  const congregationId = await getCurrentCongregationId();
  const q = query(collection(db, 'users'), where('congregationId', '==', congregationId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as User[];
};

/**
 * Hook para obtener y gestionar todos los usuarios del sistema
 * con soporte offline-first y sincronización automática.
 */
export const useUsers = () => {
  const { data: users = [], isLoading, error, mutate } = useOfflineSWR<User[]>(USERS_KEY, async () => {
    const list = await fetchCongregationUsers();

    // ✅ Cache local
    await AsyncStorage.setItem(
      USERS_KEY,
      JSON.stringify({ data: list, timestamp: Date.now() })
    );

    return list;
  });

  // Cargar primero desde cache local y luego sincronizar online
  useEffect(() => {
    (async () => {
      try {
        const cache = await AsyncStorage.getItem(USERS_KEY);
        if (cache) {
          const parsed = JSON.parse(cache);
          mutate(parsed.data, false);
        }

        // luego sincroniza con Firestore
        const onlineUsers = await fetchCongregationUsers();
        await AsyncStorage.setItem(
          USERS_KEY,
          JSON.stringify({ data: onlineUsers, timestamp: Date.now() })
        );
        mutate(onlineUsers, false);
      } catch (err) {
        console.warn('No se pudo sincronizar usuarios:', err);
      }
    })();
  }, []);

  // 🔹 Actualizar usuario
  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', id), updates);

      await mutate(
        async (current) =>
          current
            ? current.map((u) => (u.id === id ? { ...u, ...updates } : u))
            : current,
        false
      );

      const updatedCache = users.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      );
      await AsyncStorage.setItem(
        USERS_KEY,
        JSON.stringify({ data: updatedCache, timestamp: Date.now() })
      );
    } catch (err) {
      console.error('Error actualizando usuario:', err);
    }
  }, [mutate, users]);

  // 🔹 Eliminar usuario (solo Firestore, no Auth)
  const deleteUser = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));

      const newList = users.filter((u) => u.id !== id);
      await AsyncStorage.setItem(
        USERS_KEY,
        JSON.stringify({ data: newList, timestamp: Date.now() })
      );

      mutate(newList, false);
    } catch (err) {
      console.error('Error eliminando usuario:', err);
    }
  }, [mutate, users]);

  return {
    users,
    isLoading,
    error,
    updateUser,
    deleteUser,
  };
};
