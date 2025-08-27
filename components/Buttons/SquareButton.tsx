import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { clsx } from 'clsx';
import { useColorScheme } from 'nativewind';

type SquareButtonProps = {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isSelected?: boolean; // nuevo estado
};

const SquareButton: React.FC<SquareButtonProps> = ({ text, icon, onPress, isSelected = false }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={clsx(
        'h-24 w-24 flex-col items-center justify-center overflow-hidden rounded-lg shadow-md p-2',
        isSelected ? 'bg-morado' : 'bg-white dark:bg-gray-900'
      )}>
      <Ionicons
        name={icon}
        size={38}
        color={isSelected ? 'white' : isDark ? '#ffffff' : '#000000'} // 👈 Dark mode aplicado aquí
      />
      <Text
        className={clsx(
          'text-sm text-center leading-none',
          isSelected ? 'text-white' : 'text-gray-700 dark:text-white'
        )}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

export default SquareButton;
