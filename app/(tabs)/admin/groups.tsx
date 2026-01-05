import { View, Text, TouchableOpacity, FlatList, useColorScheme } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useGroup } from '~/hooks/useGroup';
import { useUsers } from '~/hooks/useUsers';
import ThemedText from 'components/ThemedText';
import { CreateGroupModal } from 'components/CreateGroupModal';
import { CustomButton } from 'components/CustomButton';
import { useRouter } from 'expo-router';

const Groups = () => {
  const { groups, isLoading } = useGroup();
  const { users } = useUsers();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      <View className="flex-1 items-center justify-center dark:bg-black2">
        <Text className="text-gray-600 dark:text-gray-400">Cargando grupos...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black2 p-4">
      <View className="mb-4 flex-col items-center justify-between">
        <ThemedText className="text-xl font-bold">Grupos</ThemedText>
        <CustomButton text="Agregar Grupo" onPress={() => setIsModalVisible(true)} />
      </View>

      <CreateGroupModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />

      <FlatList
        data={enrichedGroups}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="m-1 w-[48%] rounded-2xl bg-white dark:bg-black3 p-3 shadow"
            onPress={() => router.push(`/admin/group/${item.id}`)}>
            <ThemedText className="text-lg font-semibold">Grupo {item.number}</ThemedText>
            <Text className="mt-1 text-gray-600 dark:text-gray-400">{item.leaderName}</Text>
            <Text className="mt-1 text-gray-600 dark:text-gray-400">Territorios: {item.totalTerritories}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-gray-500 dark:text-gray-400">No hay grupos registrados</Text>
        }
      />
    </View>
  );
};

export default Groups;
