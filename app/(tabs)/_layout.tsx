import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff', // gris-800 vs blanco
          borderTopWidth: 1,
          borderTopColor: isDark ? '#374151' : '#e5e7eb', // gris-700 vs gris-200
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        },
        headerTintColor: isDark ? '#f9fafb' : '#111827', // texto claro/oscuro
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#a78bfa' : '#6d28d9', // morado distinto
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280', // gris
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="territories"
        options={{
          title: 'Territorios',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-full-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
