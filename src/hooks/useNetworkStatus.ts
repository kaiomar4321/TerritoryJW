import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

type NetworkState = 'online' | 'offline' | 'unknown';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<NetworkState>('unknown');
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Verificar estado inicial
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      
      if (connected) {
        setIsOnline('online');
        // Si estaba offline y ahora vuelve online
        if (wasOffline) {
          setWasOffline(false);
        }
      } else {
        setIsOnline('offline');
        setWasOffline(true);
      }
    });

    return () => unsubscribe();
  }, [wasOffline]);

  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }, []);

  return {
    isOnline,
    wasOffline,
    checkConnection,
    setWasOffline,
  };
};
