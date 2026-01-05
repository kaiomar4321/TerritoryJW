import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter, useSegments, Slot } from 'expo-router';
// 👈 Importa el Provider
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import NetworkStatusBanner from '../components/NetworkStatusBanner';

import '../global.css';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user && inAuthGroup) {
      router.replace('/(tabs)/');
    } else if (!user && !inAuthGroup) {
      router.replace('/(auth)/splash');
    }
  }, [user, segments, loading, router]);

  // Envolvemos el estado de carga (loader) y la aplicación con el Provider
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemeAwareStatusBar />
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#191919' }}>
            <ActivityIndicator size="large" color="#925ffa" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <NetworkStatusBanner />
            <Slot />
          </View>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemeAwareStatusBar() {
  const { isDark } = useTheme();

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
    StatusBar.setBackgroundColor(isDark ? '#191919' : '#ffffff');
  }, [isDark]);

  return null;
}