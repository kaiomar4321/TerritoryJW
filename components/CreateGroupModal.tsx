import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useGroup } from '~/hooks/useGroup';
import { useUsers } from '~/hooks/useUsers';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const CreateGroupModal = ({ visible, onClose }: Props) => {
  const { users } = useUsers();
  const { createGroup } = useGroup();
  const [number, setNumber] = useState('');
  const [leaderId, setLeaderId] = useState('');

  if (!visible) return null;

  const handleSave = async () => {
    if (!number || !leaderId) return alert('Completa todos los campos');
    await createGroup(Number(number), leaderId, []);
    setNumber('');
    setLeaderId('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-2xl bg-white p-5">
          <Text className="mb-4 text-lg font-bold text-gray-800">Crear Grupo</Text>

          <TextInput
            placeholder="Número de grupo"
            keyboardType="numeric"
            value={number}
            onChangeText={setNumber}
            className="mb-3 rounded-md border px-3 py-2"
          />

          <Text className="font-semibold text-gray-700 mb-2">Seleccionar encargado:</Text>
          {users.map((u) => (
            <TouchableOpacity
              key={u.id}
              onPress={() => setLeaderId(u.id)}
              className={`mb-1 rounded-md px-3 py-2 ${
                leaderId === u.id ? 'bg-purple-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`${
                  leaderId === u.id ? 'text-white' : 'text-gray-800'
                }`}
              >
                {u.displayName}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            className="mt-4 items-center rounded-xl bg-purple-600 py-2"
          >
            <Text className="font-semibold text-white">Guardar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="mt-2 items-center rounded-xl bg-gray-200 py-2"
          >
            <Text className="font-semibold text-gray-800">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
