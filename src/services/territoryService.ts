import { db } from '../config/firebase';
import useSWR from 'swr';
import { firestoreFetcher } from './firestoreFetcher';
import { collection, addDoc, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export const territoryService = {
  async saveTerritory(coordinates: any[], userId: string) {
    if (!coordinates || coordinates.length < 3) {
      throw new Error('Se necesitan al menos 3 puntos para crear un territorio');
    }

    try {
      await addDoc(collection(db, 'territories'), {
        coordinates,
        createdBy: userId,
        createdAt: new Date(),
        color: 'rgba(255, 0, 0, 0.8)',
        name: 'Territorio Nuevo',
        number: 0,
      });
    } catch (error) {
      console.error('Error saving territory:', error);
      throw error;
    }
  },

  async updateTerritory(id: string, updates: Partial<any>) {
    try {
      const territoryRef = doc(db, 'territories', id);
      await updateDoc(territoryRef, {
        ...updates,
        updatedAt: new Date(),
      });
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
    });
  },
};
