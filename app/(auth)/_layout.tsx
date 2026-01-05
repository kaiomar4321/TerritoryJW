import { Stack } from 'expo-router';
import { useTheme } from '~/context/ThemeContext';

export default function AuthLayout() {
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade', // transición suave entre pantallas
        contentStyle: {
          backgroundColor: isDark ? '#191919' : '#ffffff',
        },
      }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
