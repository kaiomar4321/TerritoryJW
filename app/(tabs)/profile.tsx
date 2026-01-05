// app/profile.tsx
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
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
import { useTheme } from '~/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {

  const { userData, updateUser, loading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ displayName: '' });
  const { territories, allCompleted, markAllReady } = useTerritory();
  const { isAdmin } = usePermissions();
  const { theme, isDark, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  
  useEffect(() => {
    if (userData) {
      setForm({
        displayName: userData.displayName || '',
      });
    }
  }, [userData]);

  const themeOptions = [
    { id: 'light', label: 'Claro', icon: '☀️' },
    { id: 'dark', label: 'Oscuro', icon: '🌙' },
    { id: 'system', label: 'Sistema', icon: '⚙️' },
  ];

  const currentThemeLabel = themeOptions.find((t) => t.id === theme)?.label || 'Sistema';

  if (loading) return <Text className="mt-10 text-center">Cargando perfil...</Text>;
  if (!userData)
    return <Text className="mt-10 text-center text-red-500">Usuario no encontrado</Text>;

  return (
    <ScrollView className="relative p-3 dark:bg-black1">
      {/* Encabezado con animación */}
      <MotiText
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
        className="mb-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
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
            <Text className="mt-1 text-2xl font-semibold leading-none text-gray-900 dark:text-white">
              {userData?.displayName || 'Sin nombre'}
            </Text>
            <Text className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
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

      {/* Selector de tema desplegable */}
      <View className={styles.containerCard}>
        <TouchableOpacity
          onPress={() => setShowThemeMenu(!showThemeMenu)}
          className="flex-row items-center justify-between rounded-lg bg-gray-50 dark:bg-black3 p-3">
          <View>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">Tema</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">{currentThemeLabel}</Text>
          </View>
          <MotiView
            animate={{ rotate: showThemeMenu ? '180deg' : '0deg' }}
            transition={{ type: 'timing', duration: 300 }}>
            <Ionicons name="chevron-down" size={24} color={isDark ? '#fff' : '#000'} />
          </MotiView>
        </TouchableOpacity>

        {/* Opciones desplegables */}
        {showThemeMenu && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 200 }}
            className="mt-2 gap-2">
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => {
                  setTheme(option.id as 'light' | 'dark' | 'system');
                  setShowThemeMenu(false);
                }}
                className={`rounded-lg p-3 flex-row items-center gap-3 ${
                  theme === option.id
                    ? 'bg-morado'
                    : 'bg-gray-100 dark:bg-black3'
                }`}>
                <Text className="text-xl">{option.icon}</Text>
                <Text
                  className={`text-base font-medium ${
                    theme === option.id
                      ? 'text-white'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </MotiView>
        )}
      </View>

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
