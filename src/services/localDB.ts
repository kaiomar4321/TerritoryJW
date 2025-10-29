// localDB.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const localDB = {
  async getCollection<T>(key: string): Promise<T[]> {
    try {
      const json = await AsyncStorage.getItem(key);
      if (!json) return []; // 🔹 Si no existe, devolver array vacío
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : []; // 🔹 Asegurar que sea array
    } catch (e) {
      console.error(`Error leyendo colección local (${key})`, e);
      return []; // 🔹 Siempre devolver array en caso de error
    }
  },

  async saveCollection<T>(key: string, data: T[]) {
    try {
      if (!Array.isArray(data)) {
        console.warn(`Intentando guardar algo que no es array en (${key})`);
        return;
      }
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error guardando colección local (${key})`, e);
    }
  },
};