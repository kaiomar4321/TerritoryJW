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
} from 'firebase/firestore';

export type House = {
  id: string;
  territoryId: string;
  address: string;
  reason: string;
  createdAt: any;
  createdBy: string;
  coordinates: { latitude: number; longitude: number };
};

export const houseService = {
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
      await addDoc(collection(db, 'avoidHouses'), {
        territoryId,
        address: address.trim(),
        reason: reason.trim() || 'Sin razón especificada',
        createdAt: new Date(),
        createdBy: userId,
        coordinates
      });
    } catch (error) {
      console.error('Error adding house:', error);
      throw error;
    }
  },

  async updateHouse(houseId: string, updates: { address?: string; reason?: string }) {
    try {
      const houseRef = doc(db, 'avoidHouses', houseId);
      await updateDoc(houseRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating house:', error);
      throw error;
    }
  },

  async deleteHouse(houseId: string) {
    try {
      await deleteDoc(doc(db, 'avoidHouses', houseId));
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
    });
  },
};
