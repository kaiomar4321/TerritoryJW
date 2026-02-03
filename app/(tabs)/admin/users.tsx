import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '~/config/firebase';
import { useUser } from '~/hooks/useUser';
import ThemedText from 'components/ThemedText';
import { CustomTextInput } from 'components/CustomTextInput';
import { userService } from '~/services/userService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from 'components/styles';
import { animations } from '~/utils/animations';

const db = getFirestore();

export default function UsersScreen() {
  const { userData } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }

  const handleChangeRole = async (uid: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'user' ? 'admin' : 'user';
      await userService.changeUserRole(uid, newRole);
      Alert.alert('Éxito', `Rol cambiado a ${newRole}`);
      fetchUsers();
      setExpandedUserId(null);
    } catch (error: any) {
      console.error('Error al cambiar rol:', error);
      Alert.alert('Error', error.message || 'No se pudo cambiar el rol.');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    Alert.alert('Confirmar eliminación', '¿Seguro que deseas eliminar este usuario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', uid));
            Alert.alert('Eliminado', 'Usuario eliminado correctamente.');
            fetchUsers();
          } catch (error) {
            console.error('Error al eliminar usuario:', error);
            Alert.alert('Error', 'No se pudo eliminar el usuario.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center dark:bg-black2">
        <ActivityIndicator size="large" color="#925ffa" />
        <Text className="mt-2 text-gray-500 dark:text-gray-400">Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className={styles.SAV}>
      <View className={styles.containerPage}>
        <Text className={styles.pageTitle}>Usuarios</Text>
        <View>
          <CustomTextInput
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            iconLeft="search"
            className="mb-4"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <FlatList
        data={users.filter(
          (user) =>
            user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          // Determinar qué roles puede asignar el usuario actual
          const canChangeRole =
            (userData?.role === 'superadmin' ||
              (userData?.role === 'admin' && item.role === 'user')) &&
            item.uid !== auth.currentUser?.uid;

          const availableRoles =
            userData?.role === 'superadmin'
              ? ['user', 'admin', 'superadmin']
              : userData?.role === 'admin'
                ? ['user', 'admin']
                : [];

          return (
            <View
              key={item.uid}
              className="mb-1 rounded-2xl border-b border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-black3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center gap-3">
                  <Image
                    source={{
                      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        item.displayName || 'Usuario'
                      )}`,
                    }}
                    className="h-12 w-12 rounded-full"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <ThemedText className="text-lg font-semibold">
                        {item.displayName || 'Sin nombre'}
                      </ThemedText>
                      {(item.role === 'admin' || item.role === 'superadmin') && (
                        <Ionicons
                          name={item.role === 'superadmin' ? 'shield' : 'shield-half-outline'}
                          size={18}
                          color="#6d28d9"
                        />
                      )}
                    </View>

                    <Text className="text-sm text-gray-600 dark:text-gray-400">{item.email}</Text>
                    <Text className="text-xs text-purple-600 dark:text-purple-400">
                      Rol: {item.role}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  {/* Botón de menú de roles */}
                  {canChangeRole && (
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedUserId(expandedUserId === item.uid ? null : item.uid)
                      }>
                      <Ionicons name="ellipsis-vertical" size={24} color="#6d28d9" />
                    </TouchableOpacity>
                  )}

                  {/* 🔹 Eliminar */}
                  {userData?.role === 'superadmin' && item.uid !== auth.currentUser?.uid && (
                    <TouchableOpacity onPress={() => handleDeleteUser(item.uid)}>
                      <Ionicons name="trash-outline" size={22} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Menú desplegable de roles */}
              {expandedUserId === item.uid && canChangeRole && (
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: -10 }}
                  transition={{ type: 'timing', duration: 300 }}
                  className="mt-3 rounded-lg bg-gray-50 p-2 dark:bg-black2">
                  {availableRoles
                    .filter((role) => role !== item.role)
                    .map((role) => (
                      <TouchableOpacity
                        key={role}
                        onPress={() => handleChangeRole(item.uid, role)}
                        className="flex-row items-center gap-2 rounded-lg px-3 py-2.5">
                        <Ionicons
                          name={
                            role === 'superadmin'
                              ? 'shield'
                              : role === 'admin'
                                ? 'briefcase'
                                : 'person'
                          }
                          size={18}
                          color="#6d28d9"
                        />
                        <Text className="font-medium capitalize text-gray-800 dark:text-gray-200">
                          Cambiar a {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </MotiView>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
