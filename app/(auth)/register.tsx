import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, useColorScheme } from 'react-native';

import { useRouter } from 'expo-router';
import { styles } from 'components/styles';
import { CustomButton } from 'components/CustomButton';
import { CustomTextInput } from 'components/CustomTextInput';
import ThemedText from 'components/ThemedText';
import { MotiView, AnimatePresence } from 'moti';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '~/hooks/useUser';

export default function Register() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
const {registerUser} = useUser()
  const handleRegister = async () => {
    await registerUser(email, password, confirmPassword, displayName)
  };

  return (
    <SafeAreaView>
      <AnimatePresence>
        <MotiView
          from={{ opacity: 0, translateX: 50 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: -40 }}
          transition={{ type: 'timing', duration: 500 }}
          className="flex h-full w-full items-center justify-center bg-white dark:bg-black2 p-6 ">
          <View className="flex h-full w-full gap-12">
            <TouchableOpacity onPress={() => router.push('/(auth)/welcome')} className=" ">
              <Ionicons name="arrow-back" size={28} color="#925ffa" />
            </TouchableOpacity>
            <View className=" flex gap-7">
              <View>
                <ThemedText className={styles.loginTitle}>Registrate</ThemedText>
                <Text className={`${styles.loginDescription} text-gray-600 dark:text-gray-400`}>
                  Crea tu cuenta para poder entrar a la aplicacion
                </Text>
              </View>

              <View className="flex gap-2.5">
                <CustomTextInput
                  iconLeft="person-outline"
                  placeholder="Nombre"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  keyboardType="name-phone-pad"
                  autoComplete="name"
                />
                <CustomTextInput
                  iconLeft="mail-outline"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <CustomTextInput
                  iconLeft="lock-closed-outline"
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  isPassword
                />
                <CustomTextInput
                  iconLeft="lock-closed-outline"
                  placeholder="Confirmar la Contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  isPassword
                />
              </View>

              <View className=" flex items-center justify-center">
                <CustomButton text="Registrarse" onPress={handleRegister} disabled={loading} />
                <TouchableOpacity
                  className={`mb-6 ${loading ? 'opacity-50' : ''}`}
                  onPress={() => router.push('/(auth)/login')}
                  disabled={loading}>
                  <View className=" flex flex-row pt-2">
                    <Text className="font-bold text-gray-900 dark:text-gray-100 ">¿Ya tienes cuenta?</Text>
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
