import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { clsx } from 'clsx';

type SquareButtonProps = {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isSelected?: boolean; // nuevo estado
};

const SquareButton: React.FC<SquareButtonProps> = ({ text, icon, onPress, isSelected = false }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={clsx(
        'h-24 w-24 flex-col items-center justify-center overflow-hidden rounded-lg shadow-md',
        isSelected ? 'bg-morado' : 'bg-white'
      )}>
      <Ionicons name={icon} size={38} color={isSelected ? 'white' : 'black'} />
      <Text className={clsx('text-sm text-center leading-none', isSelected ? 'text-white' : 'text-gray-700')}>{text}</Text>
    </TouchableOpacity>
  );
};

export default SquareButton;
