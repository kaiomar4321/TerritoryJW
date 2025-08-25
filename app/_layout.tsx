import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments, Slot } from 'expo-router';
import { ThemeProvider } from 'components/ThemeProvider'; // 👈 importa el provider
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

  return (
    <ThemeProvider> 
      <Slot /> 
    </ThemeProvider>
  );
}
