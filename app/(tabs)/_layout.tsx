import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
          headerRight: () => (
            <Ionicons name="locate" size={24} color="#000" style={{ marginRight: 15 }} />
          ),
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
