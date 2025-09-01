import AsyncStorage from '@react-native-async-storage/async-storage';
import { Territory } from '~/types/Territory';

const STORAGE_KEY = 'territories';

export const localDB = {
  async getTerritories(): Promise<Territory[]> {
    try {
      console.log('sacando territorios del local');
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Error leyendo territorios locales', e);
      return [];
    }
  },

  async saveTerritories(territories: Territory[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(territories));
    } catch (e) {
      console.error('Error guardando territorios locales', e);
    }
  },
};
