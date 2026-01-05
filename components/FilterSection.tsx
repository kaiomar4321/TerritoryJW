import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomTextInput } from 'components/CustomTextInput';
import { FILTER_OPTIONS, FilterOption } from '~/types/FilterOption';
import { SortOption } from '~/hooks/useFilterSort';

interface FilterSectionProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  filterOption: FilterOption | null;
  sortOption: SortOption;
  onOpenBottomSheet: () => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  searchQuery,
  onSearchChange,
  filterOption,
  sortOption,
  onOpenBottomSheet,
}) => {
  return (
    <View>
      {/* Buscador */}
      <CustomTextInput
        placeholder="Buscar por nombre o número..."
        value={searchQuery}
        onChangeText={onSearchChange}
        iconLeft="search"
        className="mb-4"
        placeholderTextColor="#9CA3AF"
      />

      {/* Filtros y Orden */}
      <View className="flex-row gap-3">
        {/* Estados */}
        <TouchableOpacity
          onPress={onOpenBottomSheet}
          className="flex-1 rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-black3">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="filter" size={16} color="#9CA3AF" />
            <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Estados</Text>
          </View>
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {filterOption ? FILTER_OPTIONS.find((o) => o.id === filterOption)?.label : 'Todos'}
          </Text>
        </TouchableOpacity>

        {/* Ordenar Por */}
        <TouchableOpacity
          onPress={onOpenBottomSheet}
          className="flex-1 rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-black3">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="swap-vertical" size={16} color="#9CA3AF" />
            <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Ordenar</Text>
          </View>
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {sortOption ? sortOption : 'Sin orden'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
