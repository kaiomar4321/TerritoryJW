import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { useTerritory } from '~/hooks/useTerritory';
import { useGroup } from '~/hooks/useGroup';
interface AssignTerritoryModalProps {
  visible: boolean;
  onClose: () => void;
  idGroup: string;
}

const AssignTerritoryModal = ({ visible, onClose, idGroup }: AssignTerritoryModalProps) => {
  const { territories, isLoading, error } = useTerritory();
  const { assignTerritory } = useGroup()
  const getTerritoryStatus = (territory: any) => {
    if (!territory.groupId) return 'available';
    if (territory.groupId === idGroup) return 'selected';
    return 'occupied';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-xl w-[90%] max-h-[80%] shadow-lg">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-lg font-bold">Asignar Territorio</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Text className="text-2xl text-gray-600">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="p-4">
            {isLoading && <Text className="text-center text-gray-600 my-5">Cargando...</Text>}
            {error && <Text className="text-center text-red-600 my-5">Error: {error}</Text>}
            
            {territories.map((territory) => {
              const status = getTerritoryStatus(territory);
              const isDisabled = status === 'occupied';
              
              return (
                <TouchableOpacity 
                  key={territory.id} 
                  className={`
                    p-4 rounded-lg mb-3
                    ${status === 'available' ? 'bg-gray-50' : ''}
                    ${status === 'selected' ? 'bg-gray-50 border-2 border-purple-500' : ''}
                    ${status === 'occupied' ? 'bg-gray-200 opacity-50' : ''}
                  `}
                  disabled={isDisabled}
                  onPress={() => {
                    if (!isDisabled) {
                      console.log('Territorio seleccionado:', territory);
                      assignTerritory( idGroup, territory.id)
                    }
                  }}
                >
                  <Text className={`
                    text-base font-semibold mb-1
                    ${status === 'occupied' ? 'text-gray-400' : 'text-gray-900'}
                  `}>
                    {territory.name}
                  </Text>
                  <Text className={`
                    text-sm
                    ${status === 'occupied' ? 'text-gray-400' : 'text-gray-600'}
                  `}>
                    {territory.groupId ? `Grupo: ${territory.groupId}` : 'Sin grupo asignado'}
                  </Text>
                  {status === 'selected' && (
                    <Text className="text-xs text-purple-600 mt-1">✓ Ya asignado a este grupo</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AssignTerritoryModal;