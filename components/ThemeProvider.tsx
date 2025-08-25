import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';

type Theme = 'dark' | 'light';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(colorScheme || 'light');

  useEffect(() => {
    if (colorScheme) {
      setTheme(colorScheme);
    }
  }, [colorScheme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <View className={`flex-1 ${theme === 'dark' ? 'dark' : ''}`}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};