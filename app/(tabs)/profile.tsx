// app/profile.tsx
import { View, Text, ScrollView, Image } from 'react-native';
import { authService } from '~/services/authService';
import { router } from 'expo-router';
import { CustomButton } from 'components/CustomButton';
import { CustomTextInput } from 'components/CustomTextInput';
import { useUser } from '~/hooks/useUser';
import { useState, useEffect } from 'react';
import { MotiView, MotiText } from 'moti';
import { styles } from 'components/styles';
import { TerritoryStats } from 'components/TerritoryStats';
import { useTerritory } from '~/hooks/useTerritory';

export default function Profile() {
  const { userData, updateUser, loading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ displayName: '' });
  const { territories, allCompleted, allReady, markAllCompleted, markAllReady } = useTerritory();

  useEffect(() => {
    if (userData) {
      setForm({
        displayName: userData.displayName || '',
      });
    }
  }, [userData]);

  if (loading) return <Text className="mt-10 text-center">Cargando perfil...</Text>;
  if (!userData)
    return <Text className="mt-10 text-center text-red-500">Usuario no encontrado</Text>;

  return (
    <ScrollView className={styles.containerCard}>
      {/* Encabezado con animación */}
      <MotiText
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
        className="mb-6 text-center text-3xl font-extrabold text-morado">
        Mi Perfil
      </MotiText>

      {/* Tarjeta de usuario */}
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="items-center rounded-2xl bg-white p-6 shadow-md">
        <Image
          source={{
            uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              form.displayName || 'Usuario'
            )}`,
          }}
          className="mb-4 h-24 w-24 rounded-full border-4 border-morado"
        />
        <Text className="text-sm font-medium text-gray-700">{userData?.email}</Text>
        <Text className="mt-1 text-base font-semibold text-gray-900">
          {userData?.displayName || 'Sin nombre'}
        </Text>
      </MotiView>

      {/* Formulario / Botones */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 700, delay: 200 }}
        className="mt-10 space-y-4">
        {isEditing ? (
          <>
            <CustomTextInput
              placeholder="Nombre"
              value={form.displayName}
              onChangeText={(text) => setForm((prev) => ({ ...prev, displayName: text }))}
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
        <CustomButton
          text="Marcar todos como Listos"
          onPress={markAllReady}
          variant="primary"
          disabled={allReady} // 🔒 se desactiva si ya están listos
          fullWidth
          className="mb-4"
        />
        <CustomButton
          text="Marcar todos como Terminados"
          onPress={markAllCompleted}
          variant="secondary"
          disabled={allCompleted} // 🔒 se desactiva si ya están terminados
          fullWidth
        />
      </MotiView>
      <TerritoryStats territories={territories} />
    </ScrollView>
  );
}
