import { useCallback } from 'react';
import { auth } from '~/config/firebase';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, reload } from 'firebase/auth';
import { useOfflineSWR } from '~/hooks/useOfflineSWR';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mutate } from 'swr';

const db = getFirestore();

export const useUser = () => {
  const uid = auth.currentUser?.uid;

  // 🔹 Hook principal: obtiene datos de Firestore con cache offline
  const { data: userData, error, isLoading } = useOfflineSWR(
    uid ? `user/${uid}` : null,
    async () => {
      if (!uid) throw new Error('No hay usuario autenticado');
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        return { uid, ...snap.data() };
      } else {
        // fallback a datos de auth si no hay documento en Firestore
        return {
          uid,
          displayName: auth.currentUser?.displayName || '',
          photoURL: auth.currentUser?.photoURL || '',
          email: auth.currentUser?.email || '',
        };
      }
    },
    { ttl: 1000 * 60 * 5 } // cache válido 5 minutos (ajústalo a tu gusto)
  );

  // 🔹 Update optimista
  const updateUser = useCallback(
    async (data: { displayName?: string; photoURL?: string; [key: string]: any }) => {
      if (!uid) return;

      // 1. Optimistic update → UI se actualiza al instante
      mutate(
        `user/${uid}`,
        (prev: any) => ({ ...prev, ...data }),
        false
      );

      try {
        // 2. Guardar en Firestore
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, data);

        // 3. Actualizar Auth si aplica
        if (data.displayName || data.photoURL) {
          await updateProfile(auth.currentUser!, {
            displayName: data.displayName,
            photoURL: data.photoURL,
          });
          await reload(auth.currentUser!); // forzar refresh de Firebase Auth
        }

        // 4. Guardar en AsyncStorage (offline cache inmediato)
        await AsyncStorage.setItem(
          `user/${uid}`,
          JSON.stringify({ data: { ...userData, ...data }, timestamp: Date.now() })
        );

        // 5. Revalidar SWR con fetcher real (asegura consistencia)
        mutate(`user/${uid}`);
      } catch (err) {
        console.error('Error actualizando usuario:', err);

        // rollback en caso de error
        mutate(`user/${uid}`);
        throw err;
      }
    },
    [uid, userData]
  );

  return {
    userData,
    updateUser,
    loading: isLoading,
    error,
  };
};
