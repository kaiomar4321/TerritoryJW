// app/profile.tsx
import { View, Text, ScrollView, Image } from 'react-native';
import { auth } from '~/config/firebase';
import { authService } from '~/services/authService';
import { CustomButton } from 'components/CustomButton';
import { router } from 'expo-router';

export default function Profile() {
  const user = auth.currentUser;

  return (
    <ScrollView className="flex-1 bg-gray-50  px-5 pt-10">
      <Text className="mb-6 text-center text-3xl font-extrabold text-morado">
        Mi Perfil
      </Text>

      {/* Tarjeta de usuario */}
      <View className="items-center rounded-2xl bg-white p-6 shadow-md ">
        {/* Avatar */}
        <Image
          source={{
            uri:
              user?.photoURL ??
              'https://ui-avatars.com/api/?name=' +
                encodeURIComponent(user?.displayName || 'Usuario'),
          }}
          className="mb-4 h-24 w-24 rounded-full border-4 border-morado"
        />


        {/* Correo */}
        <Text className="text-sm text-gray-600 ">{user?.email}</Text>

       
      </View>

      {/* Acciones */}
      <View className="mt-10 space-y-4">
        

        <CustomButton
          text="Cerrar sesión"
          variant="danger"
          onPress={async () => {
            try {
              await authService.logout();
              router.replace('/(auth)/login'); // ajusta según tu estructura
            } catch (e) {
              console.error('Error al cerrar sesión:', e);
            }
          }}
        />
      </View>
    </ScrollView>
  );
}
