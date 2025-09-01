import { db } from '../config/firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Territory } from '~/types/Territory';

const STORAGE_KEY = 'local_territories';

export const offlineTerritoryService = {
  async loadTerritories(): Promise<Territory[]> {
    try {
      // 1. Intentar leer desde almacenamiento local
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log('📦 Cargando territorios desde LOCAL STORAGE');
        return parsed;
      } else {
        console.log('❌ No había datos en local');
        return [];
      }
    } catch (error) {
      console.error('Error leyendo del storage local:', error);
      return [];
    }
  },

  async syncWithRemote(): Promise<Territory[]> {
    try {
      const q = query(collection(db, 'territories'));
      const snapshot = await getDocs(q);

      const territories: Territory[] = [];
      snapshot.forEach((doc) => {
        territories.push({ id: doc.id, ...doc.data() } as Territory);
      });

      // Guardar en local
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(territories));

      console.log('🌐 Cargando territorios desde FIREBASE y guardando en local');
      return territories;
    } catch (error) {
      console.error('Error sincronizando con Firebase:', error);
      return this.loadTerritories();
    }
  },

  subscribeToRemote(callback: (territories: Territory[]) => void) {
    const q = query(collection(db, 'territories'));
    return onSnapshot(q, async (snapshot) => {
      const territories: Territory[] = [];
      snapshot.forEach((doc) => {
        territories.push({ id: doc.id, ...doc.data() } as Territory);
      });

      // Actualizar local cada vez que cambie
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(territories));

      console.log('🔄 Actualización en tiempo real desde FIREBASE');
      callback(territories);
    });
  },
};
