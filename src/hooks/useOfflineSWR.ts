import useSWR, { SWRConfiguration, Key, SWRResponse, mutate } from "swr";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OfflineConfig extends SWRConfiguration {
  ttl?: number; // tiempo de vida en ms
}

export function useOfflineSWR<Data = any, Error = any>(
  key: Key,
  fetcher: () => Promise<Data>,
  config?: OfflineConfig
): SWRResponse<Data, Error> {
  const wrappedFetcher = async (): Promise<Data> => {
    try {
      const data = await fetcher();
      const payload = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(String(key), JSON.stringify(payload));
      return data;
    } catch (error) {
      const cached = await AsyncStorage.getItem(String(key));
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);

        // Checar TTL (si existe)
        if (config?.ttl && Date.now() - timestamp > config.ttl) {
          await AsyncStorage.removeItem(String(key));
          throw error; // cache expirado → forzar error
        }

        return data as Data;
      }
      throw error;
    }
  };

  return useSWR<Data, Error>(key, wrappedFetcher, config);
}

/**
 * Helper para limpiar manualmente un cache
 */
export async function clearOfflineCache(key: string) {
  await AsyncStorage.removeItem(key);
  mutate(key, undefined, false); // limpia SWR también
}
