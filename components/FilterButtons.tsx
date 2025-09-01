import React from 'react';
import { ScrollView, View } from 'react-native';
import { FILTER_OPTIONS } from '~/types/FilterOption';
import Ionicons from '@expo/vector-icons/Ionicons';
import SquareButton from './Buttons/SquareButton';
type Props = {
  selectedFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
};

const FilterButtons: React.FC<Props> = ({ selectedFilter, onFilterChange }) => {
  return (
    <View className="absolute top-5   z-10   gap-2   p-1 px-2">
      <ScrollView showsHorizontalScrollIndicator={false} className="  rounded-lg bg-white p-2  ">
        {FILTER_OPTIONS.map((option) => (
          <SquareButton
            key={option.id}
            text={option.label}
            icon={option.icon as keyof typeof Ionicons.glyphMap}
            isSelected={selectedFilter === option.id}
            onPress={() => onFilterChange(selectedFilter === option.id ? null : option.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default FilterButtons;
