import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { FILTER_OPTIONS } from '~/types/FilterOption';



type Props = {
  selectedFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
};

const FilterButtons: React.FC<Props> = ({ selectedFilter, onFilterChange }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="absolute top-20 z-10 max-h-12  w-full  px-2"
    >
      {FILTER_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.id}
          onPress={() => onFilterChange(selectedFilter === option.id ? null : option.id)}
          className={` mr-3 rounded-full px-4 py-2 border-2 border-gray-600 ${
            selectedFilter === option.id ? 'bg-blue-500' : 'bg-white'
          } shadow-md`}
        >
          <Text
            className={`text-sm ${selectedFilter === option.id ? 'text-white' : 'text-gray-700'}`}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default FilterButtons;