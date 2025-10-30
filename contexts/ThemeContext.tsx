import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  colorScheme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem('@theme_mode').then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        setThemeModeState(saved);
      }
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('@theme_mode', mode);
  };

  const colorScheme =
    themeMode === 'auto' ? (deviceColorScheme ?? 'light') : themeMode;

  return (
    <ThemeContext.Provider value={{ colorScheme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
