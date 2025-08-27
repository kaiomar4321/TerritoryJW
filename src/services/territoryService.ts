import { db } from '../config/firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { mutate } from 'swr';
import { Territory } from '~/types/Territory';

export const TERRITORIES_KEY = 'firestore:territories';

export const territoryService = {
  async saveTerritory(coordinates: any[], userId: string) {
    if (!coordinates || coordinates.length < 3) {
      throw new Error('Se necesitan al menos 3 puntos para crear un territorio');
    }

    try {
      const newTerritory = {
        coordinates,
        createdBy: userId,
        createdAt: new Date(),
        color: 'rgba(255, 0, 0, 0.8)',
        name: 'Territorio Nuevo',
        number: 0,
      };

      const docRef = await addDoc(collection(db, 'territories'), newTerritory);

      // Invalidar y refrescar el caché de SWR
      mutate(TERRITORIES_KEY);

      return { id: docRef.id, ...newTerritory };
    } catch (error) {
      console.error('Error saving territory:', error);
      throw error;
    }
  },

  async updateTerritory(id: string, updates: Partial<Territory>) {
    try {
      const territoryRef = doc(db, 'territories', id);
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(territoryRef, updateData);

      // Invalidar y refrescar el caché de SWR
      mutate(TERRITORIES_KEY);

      return updateData;
    } catch (error) {
      console.error('Error updating territory:', error);
      throw error;
    }
  },

  subscribeToTerritories(callback: (territories: any[]) => void) {
    const q = query(collection(db, 'territories'));
    return onSnapshot(q, (snapshot) => {
      const territories: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Asegurarse de que las coordenadas existan y sean válidas
        if (data.coordinates && data.coordinates.length >= 3) {
          territories.push({
            id: doc.id,
            ...data,
          });
        }
      });
      callback(territories);

      // Actualizar el caché de SWR con los datos en tiempo real
      mutate(TERRITORIES_KEY, territories, false);
    });
  },

  // Función para revalidar manualmente
  revalidateTerritories() {
    return mutate(TERRITORIES_KEY);
  },
};
