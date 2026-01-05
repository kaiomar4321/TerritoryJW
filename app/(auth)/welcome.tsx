import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import ThemedText from 'components/ThemedText';
import { styles } from 'components/styles';
import { CustomButton } from 'components/CustomButton';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView>
      <View>
        <AnimatePresence>
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -20 }}
            transition={{ duration: 600 }}
            className="flex h-full w-full items-start justify-end bg-white dark:bg-black2 p-6 gap-2.5 ">
            <ThemedText className={styles.loginTitle}>Bienvenido.</ThemedText>
            <ThemedText className={styles.loginTitle}>
              Puedes iniciar sesion o crear una nueva cuenta
            </ThemedText>

            <MotiView
              from={{ opacity: 0, translateY: 50 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300, duration: 600 }}
              className="flex w-full gap-2.5">
              <CustomButton text="Iniciar Sesión" onPress={() => router.push('/(auth)/login')} />
              <CustomButton variant='secondary' text="Registrarse" onPress={() => router.push('/(auth)/register')} />
            </MotiView>
          </MotiView>
        </AnimatePresence>
      </View>
    </SafeAreaView>
  );
}
