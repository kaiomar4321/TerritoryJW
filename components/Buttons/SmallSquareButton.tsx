import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { clsx } from 'clsx';
import { useTheme } from '~/context/ThemeContext';

type SquareButtonProps = {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isSelected?: boolean; // nuevo estado
};

const SquareButton: React.FC<SquareButtonProps> = ({ text, icon, onPress, isSelected = false }) => {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      className={clsx(
        'w-20 h-20 flex-col items-center justify-center overflow-hidden rounded-lg shadow-md p-2 mb-1',
        isSelected ? 'bg-morado dark:bg-morado' : 'bg-white dark:bg-black2'
      )}>
      <Ionicons
        name={icon}
        size={38}
        color={isSelected ? 'white' : isDark ? '#9CA3AF' : 'black'} 
      />
      <Text
        className={clsx(
          'text-xs text-center leading-none',
          isSelected ? 'text-white dark:text-white' : 'text-gray-700 dark:text-gray-300'
        )}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

export default SquareButton;
