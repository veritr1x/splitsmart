import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { isWeb } from '../utils/platform';
import { useTheme } from '../contexts/ThemeContext';

const WebLayout = ({ children, noPadding }) => {
  const { theme } = useTheme();
  
  // Only use this layout on web
  if (!isWeb) {
    return children;
  }
  
  return (
    <View style={styles.container}>
      <View style={[
        styles.content, 
        { 
          backgroundColor: theme.background,
          paddingHorizontal: noPadding ? 0 : 0,
          paddingTop: 0 // Fixed padding for web only
        }
      ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  content: {
    width: '100%',
    maxWidth: 1200,
    flex: 1,
  }
});

export default WebLayout; 