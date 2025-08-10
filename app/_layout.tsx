
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments, Slot } from 'expo-router';
import '../global.css'

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
    if (loading) return; // No hacer nada mientras carga

    const inAuthGroup = segments[0] === '(auth)';

    if (user && inAuthGroup) {
      // Usuario logueado pero en páginas de auth -> ir a tabs
      router.replace('/(tabs)/');
    } else if (!user && !inAuthGroup) {
      // Usuario no logueado pero no en auth -> ir a login
      router.replace('/(auth)/login');
    }
  }, [user, segments, loading, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}