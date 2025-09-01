import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, Dimensions } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { FILTER_OPTIONS, FilterOption } from '~/types/FilterOption';

export type SortOption = 'recent' | 'oldest' | 'ascNumber' | 'descNumber' | null;

const DATE_SORT_OPTIONS = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Más antiguos', value: 'oldest' },
];

const NUMBER_SORT_OPTIONS = [
  { label: 'Número ascendente', value: 'ascNumber' },
  { label: 'Número descendente', value: 'descNumber' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  filterValue: FilterOption | null;
  sortValue: SortOption;
  onSelectFilter: (value: FilterOption | null) => void;
  onSelectSort: (value: SortOption) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const FilterSortBottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  filterValue,
  sortValue,
  onSelectFilter,
  onSelectSort,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Fondo oscuro */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black">
            <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
          </MotiView>

          {/* Bottom Sheet */}
          <MotiView
            from={{ translateY: SCREEN_HEIGHT }}
            animate={{ translateY: 0 }}
            exit={{ translateY: SCREEN_HEIGHT }}
            transition={{ type: 'timing', duration: 300 }}
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              maxHeight: '70%',
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}>
            <ScrollView className="p-4">
              {/* Estado */}
              <Text className="mb-2 text-lg font-bold text-gray-800">Estado</Text>
              {[
                { id: null, label: 'Todos', icon: 'options', colorHex: '#6B7280' },
                ...FILTER_OPTIONS,
              ].map((item) => (
                <TouchableOpacity
                  key={String(item.id)}
                  onPress={() => onSelectFilter(item.id as FilterOption | null)}
                  className={`flex-row items-center gap-2 rounded-lg p-3 ${
                    filterValue === item.id ? 'bg-gray-200' : ''
                  }`}>
                  <Ionicons name={item.icon as any} size={20} color={item.colorHex} />
                  <Text className="text-gray-800">{item.label}</Text>
                </TouchableOpacity>
              ))}

              {/* Fecha */}
              <Text className="mb-2 mt-4 text-lg font-bold text-gray-800">Fecha</Text>
              {DATE_SORT_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => onSelectSort(item.value as SortOption)}
                  className={`rounded-lg p-3 ${sortValue === item.value ? 'bg-gray-200' : ''}`}>
                  <Text className="text-gray-800">{item.label}</Text>
                </TouchableOpacity>
              ))}

              {/* Número */}
              <Text className="mb-2 mt-4 text-lg font-bold text-gray-800">Número</Text>
              {NUMBER_SORT_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => onSelectSort(item.value as SortOption)}
                  className={`rounded-lg p-3 ${sortValue === item.value ? 'bg-gray-200' : ''}`}>
                  <Text className="text-gray-800">{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </MotiView>
        </>
      )}
    </AnimatePresence>
  );
};
