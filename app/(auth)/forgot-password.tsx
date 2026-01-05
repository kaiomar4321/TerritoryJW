import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';

import { useRouter } from 'expo-router';
import { styles } from 'components/styles';
import { CustomButton } from 'components/CustomButton';
import { CustomTextInput } from 'components/CustomTextInput';
import ThemedText from 'components/ThemedText';
import { MotiView, AnimatePresence } from 'moti';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '~/hooks/useUser';

export default function ForgotPassword() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const { resetPassword, loading } = useUser();

  const handleResetPassword = async () => {
    await resetPassword(email);
    if (!loading) {
      // Si la petición fue exitosa, volver al login
      setTimeout(() => {
        router.push('/(auth)/login');
      }, 1500);
    }
  };

  return (
    <SafeAreaView>
      <AnimatePresence>
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -20 }}
          transition={{ type: 'timing', duration: 500 }}
          className="flex h-full w-full items-center justify-center bg-white dark:bg-black2 p-6 ">
          <View className="flex h-full w-full gap-12">
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} className=" ">
              <Ionicons name="arrow-back" size={28} color="#925ffa" />
            </TouchableOpacity>
            <View className=" flex gap-7">
              <View>
                <ThemedText className={styles.loginTitle}>Recuperar Contraseña</ThemedText>
                <Text className={`${styles.loginDescription} text-gray-600 dark:text-gray-400`}>
                  Ingresa tu email para recibir un enlace de recuperación
                </Text>
              </View>
              <View className="flex gap-2.5">
                <CustomTextInput
                  iconLeft="mail-outline"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View className=" flex items-center justify-center">
                <CustomButton
                  text="Enviar Enlace"
                  onPress={handleResetPassword}
                  disabled={loading}
                />
                {loading && (
                  <ActivityIndicator size="large" color="#925ffa" style={{ marginTop: 12 }} />
                )}
                <TouchableOpacity
                  className={`mb-6 ${loading ? 'opacity-50' : ''}`}
                  onPress={() => router.push('/(auth)/login')}
                  disabled={loading}>
                  <View className=" flex flex-row pt-2">
                    <Text className="font-bold text-gray-900 dark:text-gray-100 ">¿Ya recuerdas tu contraseña?</Text>
                    <Text className="font-bold text-morado "> Inicia sesión</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </MotiView>
      </AnimatePresence>
    </SafeAreaView>
  );
}
