import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';

export type NeonThemeMode = 'purple' | 'blue' | 'cyan' | 'pink';
export type BaseThemeStyle = 'neon' | 'dark' | 'light';

interface ThemeContextType {
  activeTheme: NeonThemeMode;
  setThemeMode: (theme: NeonThemeMode) => void;
  themeStyle: BaseThemeStyle;
  setThemeStyle: (style: BaseThemeStyle) => void;
  glowEnabled: boolean;
  toggleGlow: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState<NeonThemeMode>(() => {
    return storage.load<NeonThemeMode>('active_theme', 'purple');
  });

  const [themeStyle, setThemeStyleState] = useState<BaseThemeStyle>(() => {
    return storage.load<BaseThemeStyle>('theme_style', 'neon');
  });

  const [glowEnabled, setGlowEnabled] = useState<boolean>(() => {
    return storage.load<boolean>('glow_enabled', true);
  });

  useEffect(() => {
    storage.save('active_theme', activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    storage.save('theme_style', themeStyle);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-neon', 'theme-dark', 'theme-light');
      document.documentElement.classList.add(`theme-${themeStyle}`);
    }
  }, [themeStyle]);

  useEffect(() => {
    storage.save('glow_enabled', glowEnabled);
  }, [glowEnabled]);

  const setThemeMode = (theme: NeonThemeMode) => {
    setActiveTheme(theme);
  };

  const setThemeStyle = (style: BaseThemeStyle) => {
    setThemeStyleState(style);
  };

  const toggleGlow = () => {
    setGlowEnabled((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        setThemeMode,
        themeStyle,
        setThemeStyle,
        glowEnabled,
        toggleGlow,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
