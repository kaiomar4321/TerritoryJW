import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from 'src/config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { styles } from 'components/styles';
import { CustomButton } from 'components/CustomButton';
import { CustomTextInput } from 'components/CustomTextInput';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Solo hacer login, el _layout.tsx se encargará de la redirección
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Registro de nuevo usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Crear documento de usuario en Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          role: 'user', // Por defecto todos son usuarios normales
          createdAt: new Date(),
        });
      }
      // No necesitas router.replace() aquí porque el _layout.tsx maneja la redirección automáticamente
    } catch (error: any) {
      console.error('Error de autenticación:', error);

      // Mejorar los mensajes de error
      let errorMessage = 'Error desconocido';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
      } else {
        errorMessage = isLogin ? 'Error al iniciar sesión' : 'Error al crear la cuenta';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className=" flex h-full w-full items-center justify-center ">
      <View className=' w-3/4'>
        <View className={styles.containerCard}>
          <Text className=" text-4xl font-extrabold ">
            {isLogin ? 'Inicio de Sesion' : 'Registro'}
          </Text>
          <TouchableOpacity
            className={` ${loading ? 'opacity-50' : ''}`}
            onPress={() => setIsLogin(!isLogin)}
            disabled={loading}>
            <Text className=" font-bold text-morado ">
              {isLogin ? '¿No tienes cuenta? Regístrate aqui' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>

          <View className=" flex gap-1 py-8">
            <CustomTextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <CustomTextInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="password"
              isPassword // 👈 activa el modo contraseña
            />
          </View>

          <CustomButton
            text={isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            onPress={handleAuth}
            disabled={loading}
          />
        </View>
      </View>
    </View>
  );
}
