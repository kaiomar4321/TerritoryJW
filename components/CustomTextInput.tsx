import { View, TextInput, TextInputProps, Pressable, Text, useColorScheme } from 'react-native';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const iconColor = isDark ? '#b89eff' : '#925ffa';
  const placeholderColor = isDark ? '#6b7280' : '#9c9c9c';

  return (
    <View
      className={clsx(
        'flex-col',
        fullWidth ? 'w-full' : '',
        className
      )}>
     {/*<Text className='ps-2 text-sm text-gray-500'>{props.placeholder}</Text> */} 

      <View className='flex-row items-center h-12 rounded-lg bg-gris2 dark:bg-black2 px-2.5 overflow-visible'>
        {iconLeft && (
          <Ionicons
            name={iconLeft as any}
            size={22}
            color={iconColor}
            style={{ marginRight: 8 }}
          />
        )}

        <TextInput
          className='flex-1 text-gray-900 dark:text-gray-100'
          placeholderTextColor={placeholderColor}
          secureTextEntry={isPassword && !showPassword ? true : secureTextEntry}
          {...props}
          
        />

        {isPassword ? (
          <Pressable onPress={() => setShowPassword((prev) => !prev)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={iconColor}
            />
          </Pressable>
        ) : (
          iconRight && (
            <Ionicons
              name={iconRight as any}
              size={22}
              color={iconColor}
              style={{ marginLeft: 8 }}
            />
          )
        )}
      </View>
    </View>
  );
}
