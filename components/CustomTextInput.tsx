import { View, TextInput, TextInputProps, Pressable, Text } from 'react-native';
import { clsx } from 'clsx';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = TextInputProps & {
  iconLeft?: string;   // ← ahora recibe el NOMBRE del ícono
  iconRight?: string;  // ← igual aquí
  fullWidth?: boolean;
  className?: string;
  isPassword?: boolean;
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
        'flex-col',
        fullWidth ? 'w-full' : '',
        className
      )}>
     {/*<Text className='ps-2 text-sm text-gray-500'>{props.placeholder}</Text> */} 

      <View className='flex-row items-center h-12 rounded-lg bg-gris2 px-2.5 overflow-visible'>
        {iconLeft && (
          <Ionicons
            name={iconLeft as any}
            size={22}
            color="#7b00ff"
            style={{ marginRight: 8 }}
          />
        )}

        <TextInput
          className='flex-1 text-gray-900'
          placeholderTextColor={ '#9c9c9c'}
          secureTextEntry={isPassword && !showPassword ? true : secureTextEntry}
          {...props}
          
        />

        {isPassword ? (
          <Pressable onPress={() => setShowPassword((prev) => !prev)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="#7b00ff"
            />
          </Pressable>
        ) : (
          iconRight && (
            <Ionicons
              name={iconRight as any}
              size={22}
              color="#7b00ff"
              style={{ marginLeft: 8 }}
            />
          )
        )}
      </View>
    </View>
  );
}
