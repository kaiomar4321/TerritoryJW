import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useGroup } from '~/hooks/useGroup';
import { useUsers } from '~/hooks/useUsers';
import { CreateGroupModal } from 'components/CreateGroupModal';
import { CustomButton } from 'components/CustomButton';
import { useRouter } from 'expo-router';

const Groups = () => {
  const { groups, isLoading } = useGroup();
  const { users } = useUsers();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();

  const enrichedGroups = useMemo(() => {
    return groups.map((group) => {
      const leader = users.find((u) => u.id === group.leaderId);
      return {
        ...group,
        leaderName: leader?.displayName || leader?.email || 'Sin asignar',
        totalTerritories: group.territoryIds?.length || 0,
      };
    });
  }, [groups, users]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Cargando grupos...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="mb-4 flex-col items-center justify-between">
        <Text className="text-xl font-bold">Grupos</Text>
        <CustomButton text="Agregar Grupo" onPress={() => setIsModalVisible(true)} />
      </View>

      <CreateGroupModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />

      <FlatList
        data={enrichedGroups}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="m-1 w-[48%] rounded-2xl bg-white p-3 shadow"
            onPress={() => router.push(`/admin/group/${item.id}`)}>
            <Text className="text-lg font-semibold">Grupo {item.number}</Text>
            <Text className="mt-1 text-gray-600">{item.leaderName}</Text>
            <Text className="mt-1 text-gray-600">Territorios: {item.totalTerritories}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-gray-500">No hay grupos registrados</Text>
        }
      />
    </View>
  );
};

export default Groups;
