import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';

type SortOptionType =
  | 'oldest'
  | 'newest'
  | 'oldestCompleted'
  | 'newestCompleted'
  | 'ascNumber'
  | 'descNumber'
  | null;

const options: { label: string; value: SortOptionType }[] = [
  { label: 'Sin orden', value: null },
  { label: 'Más antiguos incompletos', value: 'oldest' },
  { label: 'Más recientes incompletos', value: 'newest' },
  { label: 'Más antiguos completados', value: 'oldestCompleted' },
  { label: 'Más recientes completados', value: 'newestCompleted' },
  { label: 'Número ascendente', value: 'ascNumber' },
  { label: 'Número descendente', value: 'descNumber' },
];

interface SortFilterProps {
  value: SortOptionType;
  onChange: (option: SortOptionType) => void;
}

export const SortFilter: React.FC<SortFilterProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-2">
      <Text>Filtro:</Text>
      {/* Botón principal */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="rounded-xl border border-gray-300 bg-white p-3"
      >
        <Text className="text-gray-700">
          {options.find((o) => o.value === value)?.label || 'Ordenar por...'}
        </Text>
      </TouchableOpacity>

      {/* Modal con opciones */}
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/30"
          onPress={() => setOpen(false)}
        >
          <View className="mx-6 mt-40 rounded-xl bg-white p-4">
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="rounded-lg p-3 hover:bg-gray-100"
                >
                  <Text className="text-gray-800">{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
