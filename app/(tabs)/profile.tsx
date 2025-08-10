// app/profile.tsx
import { View, Text, ScrollView } from 'react-native';
import { authService } from '~/services/authService';
import { CustomButton } from 'components/CustomButton';
import { router } from 'expo-router';
export default function Profile() {
  return (
    <ScrollView className="flex-1 bg-white px-4 pt-10">
      <Text className="mb-4 text-center text-2xl font-bold">Perfil</Text>
      <View className="rounded-xl bg-gray-100 p-4 shadow-md"></View>

      <View className="mt-10">
        <CustomButton
          text="Cerrar sesión"
          variant="danger"
          onPress={async () => {
            try {
              await authService.logout();
              // Redirigir si usas router:
              router.replace('../login.tsx'); // depende de tu config
            } catch (e) {
              console.error('Error al cerrar sesión:', e);
            }
          }}
        />
      </View>
    </ScrollView>
  );
}
