import React, { createContext, useReducer, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';

// Create theme context
export const ThemeContext = createContext();

// Theme modes
export const ThemeMode = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Initial state
const initialState = {
  mode: ThemeMode.SYSTEM, // Default to system
  isDark: false, // Computed based on mode and system settings
};

// Theme colors
export const lightTheme = {
  ...COLORS,
  background: '#f9f9f9',
  cardBackground: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e0e0e0',
};

export const darkTheme = {
  ...COLORS,
  primary: '#000000',       // Black
  secondary: '#2a2a2a',     // Dark gray
  accent: '#555555',        // Gray for contrast - made brighter
  background: '#000000',    // Pure black
  cardBackground: '#121212', // Nearly black
  text: '#cccccc',          // Light gray text instead of pure white
  textLight: '#888888',     // Mid gray
  border: '#555555',        // Dark gray borders - made more visible
  success: '#3c3c3c',       // Dark gray instead of green
  error: '#3c3c3c',         // Dark gray instead of red
  gray: '#252525',          // Very dark gray - made more visible
  lightGray: '#333333',     // Slightly lighter gray - made more visible
};

// Theme reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_THEME_MODE':
      return {
        ...state,
        mode: action.mode,
        isDark: 
          action.mode === ThemeMode.DARK || 
          (action.mode === ThemeMode.SYSTEM && action.systemIsDark),
      };
    default:
      return state;
  }
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const systemIsDark = systemColorScheme === 'dark';
  
  const [state, dispatch] = useReducer(themeReducer, initialState);
  
  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode) {
          dispatch({ 
            type: 'SET_THEME_MODE', 
            mode: savedThemeMode,
            systemIsDark,
          });
        } else {
          // Initialize with system default if no saved preference
          dispatch({ 
            type: 'SET_THEME_MODE', 
            mode: ThemeMode.SYSTEM,
            systemIsDark,
          });
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Update theme when system theme changes
  useEffect(() => {
    if (state.mode === ThemeMode.SYSTEM) {
      dispatch({ 
        type: 'SET_THEME_MODE', 
        mode: ThemeMode.SYSTEM,
        systemIsDark,
      });
    }
  }, [systemColorScheme]);
  
  // Theme actions
  const setThemeMode = async (mode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      dispatch({ type: 'SET_THEME_MODE', mode, systemIsDark });
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };
  
  // Get current theme colors
  const theme = state.isDark ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider 
      value={{ 
        theme,
        isDark: state.isDark,
        themeMode: state.mode,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme
export const useTheme = () => useContext(ThemeContext); 