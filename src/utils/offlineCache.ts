import AsyncStorage from "@react-native-async-storage/async-storage";
import { mutate } from "swr";

/**
 * Limpia un cache específico (AsyncStorage + SWR)
 */
export async function clearOfflineCache(key: string) {
  await AsyncStorage.removeItem(key);
  mutate(key, undefined, false); // limpiar SWR también
}

/**
 * Limpia TODOS los caches persistidos en AsyncStorage
 * OJO: esto borra cualquier cosa de AsyncStorage, así que solo si tu app no guarda más cosas ahí.
 */
export async function clearAllOfflineCache() {
  await AsyncStorage.clear();
  mutate(() => true, undefined, false); // limpia todos los SWR caches
}
