import { useCallback } from 'react';
import { db } from '~/config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from 'firebase/firestore';
import { mutate } from 'swr';

export const useTerritoriesAdmin = () => {
  const TERRITORIES_KEY = 'admin/territories';

  const createTerritory = useCallback(async (data: { name: string; zone?: string }) => {
    const colRef = collection(db, 'territories');
    await addDoc(colRef, { ...data, assignedTo: null, createdAt: new Date() });
    mutate(TERRITORIES_KEY);
  }, []);

  const updateTerritory = useCallback(async (id: string, updates: any) => {
    const ref = doc(db, 'territories', id);
    await updateDoc(ref, updates);
    mutate(TERRITORIES_KEY);
  }, []);

  const deleteTerritory = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'territories', id));
    mutate(TERRITORIES_KEY);
  }, []);

  const assignUser = useCallback(async (territoryId: string, userId: string | null) => {
    const ref = doc(db, 'territories', territoryId);
    await updateDoc(ref, { assignedTo: userId });
    mutate(TERRITORIES_KEY);
  }, []);

  return {
    createTerritory,
    updateTerritory,
    deleteTerritory,
    assignUser,
  };
};
