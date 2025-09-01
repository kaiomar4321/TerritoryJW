import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FILTER_OPTIONS, FilterOption } from '~/types/FilterOption';

export type SortOption = 'recent' | 'oldest' | 'ascNumber' | 'descNumber' | null;

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Más antiguos', value: 'oldest' },
  { label: 'Número ascendente', value: 'ascNumber' },
  { label: 'Número descendente', value: 'descNumber' },
];

interface FilterSortModalProps {
  visible: boolean;
  onClose: () => void;
  filterValue: FilterOption | null;
  sortValue: SortOption;
  onSelectFilter: (value: FilterOption | null) => void;
  onSelectSort: (value: SortOption) => void;
}

export const FilterSortModal: React.FC<FilterSortModalProps> = ({
  visible,
  onClose,
  filterValue,
  sortValue,
  onSelectFilter,
  onSelectSort,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity className="flex-1 bg-black/30" onPress={onClose}>
        <View className="mx-6 mt-40 rounded-xl bg-white p-4 max-h-[70%]">
          <ScrollView>
            {/* Filtros */}
            <Text className="mb-2 text-lg font-bold text-gray-800">Filtrar por estado</Text>
            <FlatList
              data={[{ id: null, label: 'Todos', icon: 'options', colorHex: '#6B7280' }, ...FILTER_OPTIONS]}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onSelectFilter(item.id as FilterOption | null)}
                  className="flex-row items-center gap-2 rounded-lg p-3"
                >
                  <Ionicons name={item.icon as any} size={20} color={item.colorHex} />
                  <Text className="text-gray-800">{item.label}</Text>
                </TouchableOpacity>
              )}
            />

            {/* Ordenamiento */}
            <Text className="mt-4 mb-2 text-lg font-bold text-gray-800">Ordenar por</Text>
            <FlatList
              data={SORT_OPTIONS}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onSelectSort(item.value)}
                  className="rounded-lg p-3"
                >
                  <Text className="text-gray-800">{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
