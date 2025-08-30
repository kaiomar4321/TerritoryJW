// app/profile.tsx
import { View, Text, ScrollView, Image } from 'react-native';
import { authService } from '~/services/authService';
import { router } from 'expo-router';
import { CustomButton } from 'components/CustomButton';
import { CustomTextInput } from 'components/CustomTextInput';
import { useUser } from '~/hooks/useUser';
import { useState, useEffect } from 'react';

export default function Profile() {
  const { userData, updateUser, loading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ displayName: '', photoURL: '' });

  useEffect(() => {
    if (userData) {
      setForm({
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
      });
    }
  }, [userData]);

  if (loading) return <Text className="text-center mt-10">Cargando perfil...</Text>;
  if (!userData) return <Text className="text-center mt-10 text-red-500">Usuario no encontrado</Text>;

  return (
    <ScrollView className="flex-1 bg-gray-50 px-5 py-2">
      <Text className="mb-6 text-center text-3xl font-extrabold text-morado">Mi Perfil</Text>

      {/* Tarjeta de usuario */}
      <View className="items-center rounded-2xl bg-white p-6 shadow-md">
        <Image
          source={{
            uri:
              form.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(form.displayName || 'Usuario')}`,
          }}
          className="mb-4 h-24 w-24 rounded-full border-4 border-morado"
        />
        <Text className="text-sm text-gray-600">{authService.getCurrentUser()?.email}</Text>
      </View>

      {/* Formulario de edición o botón */}
      <View className="mt-10 space-y-4">
        {isEditing ? (
          <>
            <CustomTextInput
              placeholder="Nombre"
              value={form.displayName}
              onChangeText={text => setForm(prev => ({ ...prev, displayName: text }))}
            />
            <CustomTextInput
              placeholder="URL de la foto"
              value={form.photoURL}
              onChangeText={text => setForm(prev => ({ ...prev, photoURL: text }))}
            />

            <CustomButton
              text="Guardar cambios"
              variant="primary"
              onPress={async () => {
                try {
                  await updateUser(form);
                  setIsEditing(false);
                } catch (e) {
                  console.error('Error actualizando perfil:', e);
                }
              }}
            />

            <CustomButton
              text="Cancelar"
              variant="secondary"
              onPress={() => {
                setIsEditing(false);
                setForm({
                  displayName: userData.displayName || '',
                  photoURL: userData.photoURL || '',
                });
              }}
            />
          </>
        ) : (
          <CustomButton
            text="Editar perfil"
            variant="secondary"
            onPress={() => setIsEditing(true)}
          />
        )}

        <CustomButton
          text="Cerrar sesión"
          variant="danger"
          onPress={async () => {
            try {
              await authService.logout();
              router.replace('/(auth)/login');
            } catch (e) {
              console.error('Error al cerrar sesión:', e);
            }
          }}
        />
      </View>
    </ScrollView>
  );
}
