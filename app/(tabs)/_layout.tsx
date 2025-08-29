import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff', // gris-800 vs blanco
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb', // gris-700 vs gris-200
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#111827', // texto claro/oscuro
        headerShown: false,
        tabBarActiveTintColor: '#6d28d9', // morado distinto
        tabBarInactiveTintColor: '#6b7280', // gris
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
