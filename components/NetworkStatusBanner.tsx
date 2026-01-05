import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';

type NetworkStatusBannerProps = {
  onReload?: () => void;
};

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({ onReload }) => {
  const { isOnline, wasOffline, setWasOffline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    if (isOnline === 'offline') {
      setShowBanner(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (isOnline === 'online' && wasOffline) {
      // Mostrar mensaje de reconexión
      setShowBanner(true);
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          setShowBanner(false);
          setWasOffline(false);
        });
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner) return null;

  const isOffline = isOnline === 'offline';
  const animatedHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <Animated.View
      style={{
        height: animatedHeight,
        overflow: 'hidden',
      }}>
      <View
        className={`flex-row items-center justify-between px-4 py-3 ${
          isOffline
            ? 'bg-red-500 dark:bg-red-600'
            : 'bg-green-500 dark:bg-green-600'
        }`}>
        <View className="flex-row items-center flex-1">
          <Ionicons
            name={isOffline ? 'cloud-offline-outline' : 'cloud-done-outline'}
            size={20}
            color="white"
            style={{ marginRight: 12 }}
          />
          <Text className="text-white font-semibold flex-1">
            {isOffline
              ? 'Sin conexión a internet'
              : '✓ Conexión restaurada'}
          </Text>
        </View>

        {isOffline && onReload && (
          <TouchableOpacity
            onPress={onReload}
            className="bg-white/20 px-3 py-1 rounded-md ml-2">
            <Text className="text-white font-bold text-sm">Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default NetworkStatusBanner;
