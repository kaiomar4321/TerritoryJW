import React from 'react';
import { Text, TextProps } from 'react-native';
import { clsx } from 'clsx';

interface ThemedTextProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

const ThemedText: React.FC<ThemedTextProps> = ({ className, ...props }) => {
  return (
    <Text
      className={clsx('text-gray-900 dark:text-white', className)}
      {...props}
    />
  );
};

export default ThemedText;
