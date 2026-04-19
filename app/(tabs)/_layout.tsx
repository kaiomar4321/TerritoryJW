import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '~/hooks/useUser';
import { useTheme } from '~/context/ThemeContext';

export default function TabsLayout() {
  const { userData, loading, isFetching } = useUser();
  const { isDark } = useTheme();

  if (loading || isFetching || !userData || !userData.role) {
    return null;
  }

  const isAdmin = userData.role === 'admin' || userData.role === 'superadmin';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isDark ? '#191919' : '#ffffff',
          borderTopWidth: 0,
          borderTopColor: isDark ? '#2d2d2d' : '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: { 
          backgroundColor: isDark ? '#0C0C0C' : '#ffffff' 
        },
        headerTintColor: isDark ? '#ffffff' : '#111827',
        headerShown: false,
        tabBarActiveTintColor: '#925ffa',
        tabBarInactiveTintColor: isDark ? '#6b7280' : '#9ca3af',
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

      {/* ✅ Admin Tabs - siempre declarados, pero ocultos si no eres admin */}
      <Tabs.Screen
        name="admin/users"
        options={{
          title: 'Usuarios',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="admin/groups"
        options={{
          title: 'Grupos',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

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
