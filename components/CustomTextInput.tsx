
import { View, TextInput, TextInputProps, Pressable, Text } from 'react-native';
import { clsx } from 'clsx';
import { ReactNode, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = TextInputProps & {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  isPassword?: boolean; // <- NUEVA PROP
};

export function CustomTextInput({
  iconLeft,
  iconRight,
  fullWidth = true,
  className = '',
  placeholderTextColor,
  isPassword = false,
  secureTextEntry,
  ...props
}: Props) {

  const [showPassword, setShowPassword] = useState(false);

  return (
    <View
      className={clsx(
        'flex-col   ',
        fullWidth ? 'w-full' : '',
        className
      )}>
      <Text className=' ps-2 text-sm text-gray-500'>{props.placeholder}</Text>
      <View className='flex-row items-center rounded-md border  border-gray-300 bg-white  px-2 '>
        {iconLeft && <View className="mr-2">{iconLeft}</View>}
        <TextInput
          className={clsx('flex-1 text-gray-900  ')}
          placeholderTextColor={'#6B7280'}
          secureTextEntry={isPassword && !showPassword ? true : secureTextEntry}
          {...props}
          placeholder=''
        />
        {isPassword ? (
          <Pressable onPress={() => setShowPassword((prev) => !prev)}>
            {showPassword ? (
              <Ionicons
                name="eye-outline"
                size={22}
                color={'#fff'}
              />
            ) : (
              <Ionicons
                name="eye-off-outline"
                size={22}
                color={'#fff'}
              />
            )}
          </Pressable>
        ) : (
          iconRight && <View className="ml-2">{iconRight}</View>
        )}
      </View>
    </View>
  );
}
