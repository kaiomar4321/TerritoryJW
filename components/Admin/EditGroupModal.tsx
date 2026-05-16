import { View, Text, Modal, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { CustomButton } from 'components/CustomButton';
import { Group } from '~/types/Group';
import { styles } from 'components/styles';

interface EditGroupModalProps {
  visible: boolean;
  group: Group | null;
  availableLeaders: Array<{ id: string; displayName?: string; email: string }>;
  onClose: () => void;
  onSave: (number: number, leaderId: string) => Promise<void>;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  visible,
  group,
  availableLeaders,
  onClose,
  onSave,
}) => {
  const [editNumber, setEditNumber] = useState('');
  const [editLeaderId, setEditLeaderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (group) {
      setEditNumber(group.number.toString());
      setEditLeaderId(group.leaderId);
    }
  }, [group]);

  const handleSave = async () => {
    const numberValue = parseInt(editNumber);
    if (isNaN(numberValue) || numberValue <= 0) {
      Alert.alert('Error', 'El número del grupo debe ser válido');
      return;
    }

    if (!editLeaderId) {
      Alert.alert('Error', 'Debes seleccionar un encargado');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(numberValue, editLeaderId);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el grupo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="w-11/12 rounded-2xl bg-white dark:bg-black2 p-6">
          <Text className={styles.sectionTitle}>Editar Grupo</Text>

          <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Número del Grupo</Text>
          <TextInput
            value={editNumber}
            onChangeText={setEditNumber}
            keyboardType="numeric"
            className={styles.input}
            placeholder="Ej: 1"
            editable={!isLoading}
          />

          <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Encargado</Text>
          <ScrollView className="mb-4 max-h-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black3">
            {availableLeaders.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => !isLoading && setEditLeaderId(user.id)}
                className={`p-3 ${editLeaderId === user.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                disabled={isLoading}>
                <Text className={`${editLeaderId === user.id ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  {user.displayName || user.email}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex-row space-x-2">
            <View className="flex-1">
              <CustomButton 
                text="Cancelar" 
                onPress={onClose}
                disabled={isLoading}
              />
            </View>
            <View className="flex-1">
              <CustomButton 
                text={isLoading ? "Guardando..." : "Guardar"} 
                onPress={handleSave}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};