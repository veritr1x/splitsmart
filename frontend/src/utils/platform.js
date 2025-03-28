import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export const getPlatformStyles = (webStyles, mobileStyles) => {
  return isWeb ? webStyles : mobileStyles;
}; 