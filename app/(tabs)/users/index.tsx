import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '~/config/firebase';
import { useUser } from '~/hooks/useUser';
import { userService } from '~/services/userService';
import { AssignTerritoryModal } from 'components/AssignTerritoryModal';

const db = getFirestore();

export default function UsersScreen() {
  const { userData } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

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
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6d28d9" />
        <Text className="text-gray-500 mt-2">Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-800 mb-4">Lista de usuarios</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View
            key={item.uid}
            className="flex-row justify-between items-center border-b border-gray-200 py-3"
          >
            <View>
              <Text className="text-gray-900 font-semibold">{item.displayName || 'Sin nombre'}</Text>
              <Text className="text-gray-600 text-sm">{item.email}</Text>
              <Text className="text-xs text-purple-600 mt-1">Rol: {item.role}</Text>
            </View>

            <View className="flex-row space-x-3">
              {/* 🔹 Cambiar rol */}
              {(userData?.role === 'superadmin' ||
                (userData?.role === 'admin' && item.role === 'user')) &&
                item.uid !== auth.currentUser?.uid && (
                  <TouchableOpacity onPress={() => handleChangeRole(item.uid, item.role)}>
                    <Ionicons name="swap-horizontal-outline" size={22} color="#6d28d9" />
                  </TouchableOpacity>
                )}

              {/* 🔹 Asignar territorio (solo superadmin) */}
              {userData?.role === 'superadmin' && (
                <TouchableOpacity onPress={() => setSelectedUser(item.uid)}>
                  <Ionicons name="map-outline" size={22} color="#16a34a" />
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
        )}
      />

      {selectedUser && (
        <AssignTerritoryModal
          visible={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          
        />
      )}
    </View>
  );
}
