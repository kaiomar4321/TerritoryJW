import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTerritory } from '~/hooks/useTerritory';
import { useGroup } from '~/hooks/useGroup';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AssignTerritoryModal = ({ visible, onClose }: Props) => {
  const { territories, assignToGroup, unassignFromGroup } = useTerritory();
  const { groups } = useGroup();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[80%] rounded-t-2xl bg-white p-4">
          <Text className="mb-3 text-lg font-bold text-gray-800">Asignar territorio a grupo</Text>

          <FlatList
            data={territories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between rounded-lg border-b px-2 py-3">
                <View>
                  <Text className="text-base text-gray-800">{item.name}</Text>
                  {item.groupId && (
                    <Text className="text-sm text-gray-500">
                      Grupo asignado: {groups.find((g) => g.id === item.groupId)?.number || 'N/A'}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() =>
                    item.groupId
                      ? unassignFromGroup(item.id)
                      : selectedGroup
                      ? assignToGroup(item.id, selectedGroup)
                      : alert('Selecciona un grupo primero')
                  }
                  className={`rounded-md px-3 py-1 ${
                    item.groupId ? 'bg-red-100' : 'bg-green-100'
                  }`}
                >
                  <Text className={`font-semibold ${item.groupId ? 'text-red-600' : 'text-green-600'}`}>
                    {item.groupId ? 'Quitar' : 'Asignar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <Text className="mt-4 mb-2 font-semibold text-gray-700">Seleccionar grupo:</Text>
          <FlatList
            data={groups}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedGroup(item.id)}
                className={`mr-2 rounded-md border px-3 py-1 ${
                  selectedGroup === item.id ? 'bg-purple-600' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    selectedGroup === item.id ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Grupo {item.number}
                </Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity onPress={onClose} className="mt-4 items-center rounded-xl bg-purple-600 py-2">
            <Text className="font-semibold text-white">Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
