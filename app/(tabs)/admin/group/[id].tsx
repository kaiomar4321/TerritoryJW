import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGroup } from '~/hooks/useGroup';
import { useUsers } from '~/hooks/useUsers';
import { useTerritory } from '~/hooks/useTerritory';
import { CustomButton } from 'components/CustomButton';
import { EditGroupModal } from 'components/Admin/EditGroupModal';
import AssignTerritoryModal from 'components/AssignTerritoryModal';

const GroupDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { groups, updateGroup, deleteGroup,  unassignTerritory } = useGroup();
  const { users } = useUsers();
  const { territories } = useTerritory();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAssignTerritoryModalVisible, setIsAssignTerritoryModalVisible] = useState(false);

  const group = useMemo(() => {
    return groups.find((g) => g.id === id);
  }, [groups, id]);

  const leader = useMemo(() => {
    if (!group) return null;
    return users.find((u) => u.id === group.leaderId);
  }, [group, users]);

  const availableLeaders = useMemo(() => {
    return users.filter((u) => u.role === 'superadmin' || u.role === 'admin');
  }, [users]);

  // Territorios disponibles para asignar (que no estén asignados a ningún grupo)
  const availableTerritories = useMemo(() => {
    return territories.filter((t) => !t.groupId || t.groupId === null);
  }, [territories]);

  // Obtener información completa de los territorios asignados
  const assignedTerritories = useMemo(() => {
    if (!group) return [];
    return group.territoryIds.map((tId) => territories.find((t) => t.id === tId)).filter(Boolean);
  }, [group, territories]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveEdit = async (number: number, leaderId: string) => {
    if (!group) return;

    await updateGroup(group.id, { number, leaderId });
    Alert.alert('Éxito', 'Grupo actualizado correctamente');
  };



  const handleUnassignTerritory = (territoryId: string, territoryName: string) => {
    if (!group) return;

    Alert.alert(
      'Desasignar Territorio',
      `¿Estás seguro de quitar el territorio "${territoryName}" de este grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desasignar',
          style: 'destructive',
          onPress: async () => {
            try {
              await unassignTerritory(group.id, territoryId);
              Alert.alert('Éxito', 'Territorio desasignado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo desasignar el territorio');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert('Eliminar Grupo', `¿Estás seguro de eliminar el Grupo ${group?.number}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (group?.id) {
            await deleteGroup(group.id);
            router.back();
          }
        },
      },
    ]);
  };

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Grupo no encontrado</Text>
        <CustomButton text="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4">
          {/* Header */}
          <View className="mb-6 rounded-2xl bg-white p-6 shadow">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-blue-600">Grupo #{group.number}</Text>
              <View className="rounded-full bg-blue-100 px-4 py-2">
                <Text className="text-sm font-semibold text-blue-600">
                  {group.territoryIds?.length || 0} Territorios
                </Text>
              </View>
            </View>
            <CustomButton text="Editar Información" onPress={() => setIsEditModalVisible(true)} />
          </View>

          {/* Información del Encargado */}
          <View className="mb-4 rounded-2xl bg-white p-6 shadow">
            <Text className="mb-4 text-lg font-bold text-gray-800">Encargado</Text>
            <View className="flex-row items-center">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Text className="text-xl font-bold text-blue-600">
                  {leader?.displayName?.charAt(0) || leader?.email?.charAt(0) || '?'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">
                  {leader?.displayName || 'Sin nombre'}
                </Text>
                <Text className="text-sm text-gray-500">{leader?.email || 'Sin email'}</Text>
              </View>
            </View>
          </View>

          {/* Territorios Asignados */}
          <View className="mb-4 rounded-2xl bg-white p-6 shadow">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-800">Territorios Asignados</Text>
              <TouchableOpacity
                onPress={() => setIsAssignTerritoryModalVisible(true)}
                className="rounded-lg bg-blue-500 px-3 py-2">
                <Text className="text-sm font-semibold text-white">+ Agregar</Text>
              </TouchableOpacity>
            </View>
            {assignedTerritories && assignedTerritories.length > 0 ? (
              <View className="space-y-2">
                {assignedTerritories.map(
                  (territory) =>
                    territory && (
                      <TouchableOpacity
                        key={territory.id}
                        onPress={() => handleUnassignTerritory(territory.id, territory.name)}
                        className="flex-row items-center justify-between rounded-lg bg-blue-50 p-3">
                        <View className="flex-1 flex-row items-center">
                          <View
                            className="mr-3 h-4 w-4 rounded"
                            style={{ backgroundColor: territory.color }}
                          />
                          <View className="flex-1">
                            <Text className="font-medium text-gray-800">{territory.name}</Text>
                            <Text className="text-xs text-gray-500">
                              Número: {territory.number}
                            </Text>
                          </View>
                        </View>
                        <Text className="ml-2 text-lg text-red-500">✕</Text>
                      </TouchableOpacity>
                    )
                )}
              </View>
            ) : (
              <Text className="text-gray-500">No hay territorios asignados</Text>
            )}
          </View>

          {/* Información del Sistema */}
          <View className="mb-4 rounded-2xl bg-white p-6 shadow">
            <Text className="mb-4 text-lg font-bold text-gray-800">Información</Text>

            <View className="mb-3">
              <Text className="text-xs text-gray-500">ID del Grupo</Text>
              <Text className="mt-1 text-sm text-gray-700">{group.id}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-xs text-gray-500">Fecha de Creación</Text>
              <Text className="mt-1 text-sm text-gray-700">{formatDate(group.createdAt)}</Text>
            </View>

            <View>
              <Text className="text-xs text-gray-500">Última Actualización</Text>
              <Text className="mt-1 text-sm text-gray-700">{formatDate(group.updatedAt)}</Text>
            </View>
          </View>

          {/* Acciones */}
          <View className="mb-8">
            <CustomButton text="Eliminar Grupo" onPress={handleDelete} />
          </View>
        </View>
      </ScrollView>

      {/* Modales */}
      <EditGroupModal
        visible={isEditModalVisible}
        group={group}
        availableLeaders={availableLeaders}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveEdit}
      />
      <AssignTerritoryModal
        idGroup={group.id}
        visible={isAssignTerritoryModalVisible}
        onClose={() => {
          setIsAssignTerritoryModalVisible(false);
        }}
      />
    </>
  );
};

export default GroupDetail;
