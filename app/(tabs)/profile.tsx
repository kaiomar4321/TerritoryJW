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
import { usePermissions } from '~/hooks/usePermissions';

export default function Profile() {
  const { userData, updateUser, loading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ displayName: '' });
  const { territories, allCompleted, markAllReady } = useTerritory();
  const { isAdmin } = usePermissions();
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
    <ScrollView className="relative p-3 ">
      {/* Encabezado con animación */}
      <MotiText
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
        className="mb-6 text-center text-3xl font-extrabold ">
        Mi Perfil
      </MotiText>

      {/* Tarjeta de usuario */}
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className={styles.containerCard}>
        <View className=" flex w-full flex-row gap-3">
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                form.displayName || 'Usuario'
              )}`,
            }}
            className="mb-4 h-28 w-28 rounded-full border-4 border-morado"
          />
          <View className=" flex-1 justify-start pt-2 ">
            <Text className="mt-1 text-2xl font-semibold leading-none text-gray-900">
              {userData?.displayName || 'Sin nombre'}
            </Text>
            <Text className="text-sm font-medium leading-none text-gray-700">
              {userData?.email}
            </Text>

            {!isEditing && (
              <View className=" w-2/3 p-2">
                <CustomButton
                  text="Editar perfil"
                  variant="secondary"
                  onPress={() => setIsEditing(true)}
                />
              </View>
            )}
          </View>
        </View>
      </MotiView>
      {isEditing && (
        <View className={styles.containerCard}>
          <CustomTextInput
            placeholder="Nombre"
            value={form.displayName}
            onChangeText={(text) => setForm((prev) => ({ ...prev, displayName: text }))}
          />

          <View className=" flex-row gap-2">
            <View className="flex-1">
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
            </View>
            <View className="flex">
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
            </View>
          </View>
        </View>
      )}
      {/* Formulario / Botones */}
      <TerritoryStats territories={territories} />
      {allCompleted && isAdmin && (
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 200 }}
          className={styles.containerCard}>
          <View>
            <Text className="leading text-center text-xl">
              Todo el territorio se ha completado!!
            </Text>
            <Text className="text-center leading-none">¿Quiere reiniciar el territorio?</Text>
          </View>
          <CustomButton
            text="Marcar todos como Listos"
            onPress={markAllReady}
            variant="primary"
            disabled={!allCompleted} // 🔒 se desactiva si ya están listos
            fullWidth
            className="mb-4"
          />
        </MotiView>
      )}

      <View className="">
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
