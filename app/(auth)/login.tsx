import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from 'src/config/firebase'
import { doc, setDoc } from 'firebase/firestore';

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
    <View className="flex-1 justify-center p-5 bg-gray-100">
      <View className="bg-white p-5 rounded-xl shadow-lg">
        <Text className="text-2xl font-bold mb-5 text-center text-gray-800">
          {isLogin ? 'Iniciar Sesión' : 'Registro'}
        </Text>

        <TextInput
          className="h-12 border border-gray-300 rounded mb-4 px-2.5 bg-white"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        
        <TextInput
          className="h-12 border border-gray-300 rounded mb-4 px-2.5 bg-white"
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isLogin ? "password" : "new-password"}
        />

        <TouchableOpacity 
          className={`bg-blue-500 p-4 rounded items-center ${loading ? 'opacity-50' : ''}`}
          onPress={handleAuth} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className={`mt-4 p-2.5 ${loading ? 'opacity-50' : ''}`}
          onPress={() => setIsLogin(!isLogin)}
          disabled={loading}
        >
          <Text className="text-blue-500 text-center">
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}