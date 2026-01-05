import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '~/config/firebase';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  reload,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useOfflineSWR } from '~/hooks/useOfflineSWR';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mutate } from 'swr';
import { authService } from '~/services/authService'; // ✅ importamos tu servicio

const db = getFirestore();

export const useUser = () => {
  const uid = auth.currentUser?.uid;
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // 🔹 Hook principal: obtiene datos de Firestore con cache offline
  const { data: userData, error, isLoading: isFetching } = useOfflineSWR(
    uid ? `user/${uid}` : null,
    async () => {
      if (!uid) throw new Error('No hay usuario autenticado');
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        return { uid, ...data };
      } else {
        // fallback a datos de auth si no hay documento en Firestore
        const role = await authService.getUserRole(uid);
        return {
          uid,
          displayName: auth.currentUser?.displayName || '',
          photoURL: auth.currentUser?.photoURL || '',
          email: auth.currentUser?.email || '',
          role,
        };
      }
    },
    { ttl: 1000 * 60 * 5 }
  );

  // 🔹 Registro con rol
  const registerUser = useCallback(
    async (
      email: string,
      password: string,
      confirmPassword: string,
      displayName: string,
      role: 'user' | 'admin' | 'superadmin' = 'user' // 👈 nuevo parámetro
    ) => {
      if (!displayName || !email || !password || !confirmPassword) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email,
          displayName,
          role,
          createdAt: new Date(),
        });

        await AsyncStorage.setItem(
          `user/${user.uid}`,
          JSON.stringify({
            data: { uid: user.uid, email, displayName, role },
            timestamp: Date.now(),
          })
        );

        mutate(`user/${user.uid}`);
        Alert.alert('Éxito', `Cuenta creada correctamente como ${role}`);
      } catch (error: any) {
        console.error('Error al crear cuenta:', error);

        let errorMessage = 'Error al crear la cuenta';
        if (error.code === 'auth/email-already-in-use')
          errorMessage = 'Este email ya está registrado';
        else if (error.code === 'auth/weak-password')
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        else if (error.code === 'auth/invalid-email')
          errorMessage = 'Email inválido';

        Alert.alert('Error', errorMessage);
      }
    },
    []
  );

  // 🔹 Inicio de sesión con rol
  const loginUser = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoadingAction(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Cargar rol y datos desde Firestore
      const role = await authService.getUserRole(user.uid);
      const snap = await getDoc(doc(db, 'users', user.uid));

      const data = snap.exists()
        ? { ...snap.data(), role }
        : {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role,
          };

      await AsyncStorage.setItem(
        `user/${user.uid}`,
        JSON.stringify({ data, timestamp: Date.now() })
      );

      mutate(`user/${user.uid}`);
      Alert.alert('Éxito', `Inicio de sesión como ${role}`);
    } catch (error: any) {
      console.error('Error de autenticación:', error);

      let errorMessage = 'Error al iniciar sesión';
      if (error.code === 'auth/user-not-found') errorMessage = 'Usuario no encontrado';
      else if (error.code === 'auth/wrong-password') errorMessage = 'Contraseña incorrecta';
      else if (error.code === 'auth/invalid-email') errorMessage = 'Email inválido';
      else if (error.code === 'auth/too-many-requests')
        errorMessage = 'Demasiados intentos. Intenta más tarde.';

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoadingAction(false);
    }
  }, []);

  // 🔹 Update optimista (igual que antes)
  const updateUser = useCallback(
    async (data: { displayName?: string; photoURL?: string; [key: string]: any }) => {
      if (!uid) return;

      mutate(
        `user/${uid}`,
        (prev: any) => ({ ...prev, ...data }),
        false
      );

      try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, data);

        if (data.displayName || data.photoURL) {
          await updateProfile(auth.currentUser!, {
            displayName: data.displayName,
            photoURL: data.photoURL,
          });
          await reload(auth.currentUser!);
        }

        await AsyncStorage.setItem(
          `user/${uid}`,
          JSON.stringify({ data: { ...userData, ...data }, timestamp: Date.now() })
        );

        mutate(`user/${uid}`);
      } catch (err) {
        console.error('Error actualizando usuario:', err);
        mutate(`user/${uid}`);
        throw err;
      }
    },
    [uid, userData]
  );

  // 🔹 Recuperar contraseña
  const resetPassword = useCallback(async (email: string) => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    setIsLoadingAction(true);

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Éxito',
        'Se ha enviado un enlace para resetear tu contraseña a tu email. Por favor revisa tu bandeja de entrada.'
      );
    } catch (error: any) {
      console.error('Error al enviar reset:', error);

      let errorMessage = 'Error al enviar el email';
      if (error.code === 'auth/user-not-found')
        errorMessage = 'No existe una cuenta con este email';
      else if (error.code === 'auth/invalid-email') errorMessage = 'Email inválido';
      else if (error.code === 'auth/too-many-requests')
        errorMessage = 'Demasiados intentos. Intenta más tarde.';

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoadingAction(false);
    }
  }, []);

  return {
    userData,
    registerUser,
    loginUser,
    updateUser,
    resetPassword,
    loading: isLoadingAction,
    error,
  };
};
