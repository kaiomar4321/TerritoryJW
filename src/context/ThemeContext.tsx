import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = React.useState<Theme>('system');

  // Cargar tema guardado
  useEffect(() => {
    (async () => {
      const savedTheme = await AsyncStorage.getItem('app-theme');
      if (savedTheme) {
        const themeValue = savedTheme as Theme;
        setThemeState(themeValue);
        
        if (themeValue !== 'system') {
          setColorScheme(themeValue);
        }
      }
    })();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Aplicar el tema con NativeWind
    if (newTheme === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(newTheme);
    }
    
    await AsyncStorage.setItem('app-theme', newTheme);
  };

  const isDark = colorScheme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};