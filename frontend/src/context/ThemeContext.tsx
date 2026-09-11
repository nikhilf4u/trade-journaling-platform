import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import enUS from 'antd/locale/en_US'; // ⭐ English locale

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('themeMode');
    return (stored as ThemeMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.body.style.background = mode === 'dark' ? '#141414' : '#f0f2f5';
  }, [mode]);

  const toggleTheme = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ConfigProvider
        locale={enUS} // ⭐ Force English
        theme={{
          algorithm:
            mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 8,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};