import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { mutate } from 'swr';

export type House = {
  id: string;
  territoryId: string;
  address: string;
  reason: string;
  createdAt: any;
  createdBy: string;
  coordinates: { latitude: number; longitude: number };
};

// Función para generar la clave de SWR para houses
export const getHousesKey = (territoryId: string | null) =>
  territoryId ? `houses:${territoryId}` : null;

export const houseService = {
  // Función para obtener houses (compatible con SWR)
  async getHousesByTerritory(territoryId: string) {
    try {
      const q = query(collection(db, 'avoidHouses'), where('territoryId', '==', territoryId));
      const snapshot = await getDocs(q);
      const houses: House[] = [];

      snapshot.forEach((doc) => {
        houses.push({
          id: doc.id,
          ...doc.data(),
        } as House);
      });

      // Ordenar por fecha de creación (más recientes primero)
      houses.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });

      return houses;
    } catch (error) {
      console.error('Error fetching houses:', error);
      throw error;
    }
  },

  async addHouse(
    territoryId: string,
    address: string,
    reason: string,
    userId: string,
    coordinates: { latitude: number; longitude: number }
  ) {
    if (!address.trim()) {
      throw new Error('La dirección es requerida');
    }

    try {
      const newHouse = {
        territoryId,
        address: address.trim(),
        reason: reason.trim() || 'Sin razón especificada',
        createdAt: new Date(),
        createdBy: userId,
        coordinates,
      };

      const docRef = await addDoc(collection(db, 'avoidHouses'), newHouse);

      // Invalidar y refrescar el caché de SWR para este territorio
      mutate(getHousesKey(territoryId));

      return { id: docRef.id, ...newHouse };
    } catch (error) {
      console.error('Error adding house:', error);
      throw error;
    }
  },

  async updateHouse(
    houseId: string,
    updates: {
      address?: string;
      reason?: string;
      coordinates?: { latitude: number; longitude: number };
    }
  ) {
    try {
      const houseRef = doc(db, 'avoidHouses', houseId);
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(houseRef, updateData);

      // Para actualizar el caché, necesitamos obtener el territoryId
      // Una forma es invalidar todas las claves de houses
      mutate((key) => typeof key === 'string' && key.startsWith('houses:'), undefined, {
        revalidate: true,
      });

      return updateData;
    } catch (error) {
      console.error('Error updating house:', error);
      throw error;
    }
  },

  async deleteHouse(houseId: string) {
    try {
      await deleteDoc(doc(db, 'avoidHouses', houseId));

      // Invalidar todas las claves de houses
      mutate((key) => typeof key === 'string' && key.startsWith('houses:'), undefined, {
        revalidate: true,
      });
    } catch (error) {
      console.error('Error deleting house:', error);
      throw error;
    }
  },

  subscribeToHousesByTerritory(territoryId: string, callback: (houses: House[]) => void) {
    const q = query(collection(db, 'avoidHouses'), where('territoryId', '==', territoryId));

    return onSnapshot(q, (snapshot) => {
      const houses: House[] = [];
      snapshot.forEach((doc) => {
        houses.push({
          id: doc.id,
          ...doc.data(),
        } as House);
      });

      // Ordenar por fecha de creación (más recientes primero)
      houses.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });

      callback(houses);

      // Actualizar el caché de SWR con los datos en tiempo real
      mutate(getHousesKey(territoryId), houses, false);
    });
  },

  // Función para revalidar houses de un territorio específico
  revalidateHouses(territoryId: string) {
    return mutate(getHousesKey(territoryId));
  },
};
