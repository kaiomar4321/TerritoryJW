// components/CustomButton.tsx
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import {clsx} from 'clsx'
import { ReactNode } from 'react';

type Props = {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
};

export function CustomButton({
  text,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = true,
  className = '',
}: Props) {
  const baseStyle = 'px-4 py-3 rounded-md  flex-row items-center justify-center';
  const variants = {
    primary: 'bg-morado',
    secondary: 'bg-gris text-gray-900',
    danger: 'bg-red-600 text-white',
  };
  const selected = variants[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={clsx(
        baseStyle,
        selected,
        disabled ? 'opacity-50' : '',
        fullWidth ? 'w-full' : '',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View className="flex-row items-center space-x-2">
          {iconLeft && <View>{iconLeft}</View>}
          <Text className="font-semibold text-white">{text}</Text>
          {iconRight && <View>{iconRight}</View>}
        </View>
      )}
    </Pressable>
  );
}
