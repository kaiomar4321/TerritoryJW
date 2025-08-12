import { Pressable, Text, View } from 'react-native';
import React from 'react';
import { House } from '~/services/houseService';

type Props = {
  selectedHouse: House;
  deleteHouse: () => void;
  setSelectedHouse: () => void;
};

const SelectedHouse: React.FC<Props> = ({ selectedHouse, deleteHouse, setSelectedHouse }) => {
  return (
    <View className=" w-6/12 bg-white p-2 ">
      <Pressable className="" onPress={setSelectedHouse}>
        <Text className="text-right text-xs text-gray-500">Cerrar</Text>
      </Pressable>
      <Text className="text-base font-bold">{selectedHouse.address}</Text>
      {selectedHouse.reason && (
        <Text className=" text-sm text-gray-600">{selectedHouse.reason}</Text>
      )}

      <View className="mt-3 flex-row gap-2">
        <Pressable className="flex-1 rounded bg-red-500 px-3 py-1" onPress={deleteHouse}>
          <Text className="text-center text-sm text-white">Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default SelectedHouse;
