import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { FILTER_OPTIONS } from '~/types/FilterOption';

const { height } = Dimensions.get('window');

type FilterType = 'status' | 'date' | 'number';

type FilterOption = {
  id: string;
  label: string;
  colorHex?: string;
  icon?: string;
};

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: FilterType, value: string) => void;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  if (!visible) return null;

  const dateOptions: FilterOption[] = [
    { id: 'dateAsc', label: 'Fecha ascendente' },
    { id: 'dateDesc', label: 'Fecha descendente' },
  ];

  const numberOptions: FilterOption[] = [
    { id: 'numAsc', label: 'Número ascendente' },
    { id: 'numDesc', label: 'Número descendente' },
  ];

  return (
    <View className="absolute inset-0 bg-black/30">
      {/* Fondo clickeable */}
      <TouchableOpacity
        className="flex-1"
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Contenedor animado */}
      <MotiView
        from={{ translateY: height }}
        animate={{ translateY: 0 }}
        exit={{ translateY: height }}
        transition={{ type: 'timing', duration: 300 }}
        className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-6 shadow-lg"
      >
        <Text className="mb-4 text-lg font-bold">Filtros</Text>

        {/* Filtro por estado */}
        <Text className="mb-2 font-semibold text-gray-700">Por estado</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => {
                onSelect('status', opt.id);
                onClose();
              }}
              className="flex-row items-center rounded-full border border-gray-300 px-3 py-2"
              style={{ backgroundColor: opt.colorHex + '20' }}
            >
              {opt.icon && <View className="mr-1">{opt.icon}</View>}
              <Text className="text-gray-800">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filtro por fecha */}
        <Text className="mb-2 font-semibold text-gray-700">Por fecha</Text>
        <View className="mb-4 flex-row gap-2">
          {dateOptions.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => {
                onSelect('date', opt.id);
                onClose();
              }}
              className="rounded-full border border-gray-300 px-3 py-2"
            >
              <Text className="text-gray-800">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filtro por número */}
        <Text className="mb-2 font-semibold text-gray-700">Por número</Text>
        <View className="flex-row gap-2">
          {numberOptions.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => {
                onSelect('number', opt.id);
                onClose();
              }}
              className="rounded-full border border-gray-300 px-3 py-2"
            >
              <Text className="text-gray-800">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </MotiView>
    </View>
  );
};
