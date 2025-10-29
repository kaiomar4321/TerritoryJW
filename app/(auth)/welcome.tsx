import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { styles } from 'components/styles';
import { CustomButton } from 'components/CustomButton';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView>
      <View>
        <AnimatePresence>
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -20 }}
            transition={{ duration: 600 }}
            className="flex h-full w-full items-start justify-end bg-white p-6 gap-2.5 ">
            <Text className={styles.loginTitle}>Bienvenido.</Text>
            <Text className={styles.loginTitle}>
              Puedes iniciar sesion o crear una nueva cuenta
            </Text>

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
