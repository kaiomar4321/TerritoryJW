import { View, Text, TouchableOpacity, FlatList, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import { useGroup } from '~/hooks/useGroup';
import { useUsers } from '~/hooks/useUsers';
import ThemedText from 'components/ThemedText';
import { CreateGroupModal } from 'components/CreateGroupModal';
import { CustomButton } from 'components/CustomButton';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from 'components/styles';

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
    <SafeAreaView className={styles.SAV}>
      <View className={styles.containerPage}>
        <Text className={styles.pageTitle}>Grupos</Text>

        <View className="mb-4">
          <CustomButton text="Agregar Grupo" onPress={() => setIsModalVisible(true)} />
        </View>

        <CreateGroupModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
      </View>
      <FlatList
        data={enrichedGroups}
        contentContainerStyle={{ padding: 12 }}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="m-1 w-[48%] rounded-2xl bg-white p-3 shadow dark:bg-black3"
            onPress={() => router.push(`/admin/group/${item.id}`)}>
            <View className="flex-row items-center gap-2 mb-2">
              <ThemedText className="text-lg font-semibold">Grupo {item.number}</ThemedText>
              <Ionicons name="people" size={24} color="#6d28d9" />
            </View>
            <Text className="mt-1 text-gray-600 dark:text-gray-400">{item.leaderName}</Text>
            <Text className=" text-sm mt-1 text-gray-600 dark:text-gray-400">
              Territorios: {item.totalTerritories}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-gray-500 dark:text-gray-400">
            No hay grupos registrados
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default Groups;
