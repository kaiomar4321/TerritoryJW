import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '~/hooks/useUser';

export default function TabsLayout() {
  // ✅ Obtenemos los datos del usuario desde tu propio hook
  const { userData, loading } = useUser();

  if (loading) return null; // o muestra un loader si prefieres

  const role = userData?.role;

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
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#111827',
        headerShown: false,
        tabBarActiveTintColor: '#6d28d9',
        tabBarInactiveTintColor: '#6b7280',
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

      {/* ✅ Solo visible si es admin o superadmin */}
      {(role === 'admin' || role === 'superadmin') && (
        <Tabs.Screen
          name="admin/users"
          options={{
            title: 'Usuarios',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
      )}

      {(role === 'admin' || role === 'superadmin') && (
        <Tabs.Screen
          name="admin/groups"
          options={{
            title: 'Grupos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
      )}

      <Tabs.Screen
        name="admin/group/[id]"
        options={{
          href: null, // Esto oculta la pantalla del tab bar
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
