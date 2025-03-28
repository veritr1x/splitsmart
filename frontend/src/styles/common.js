import { StyleSheet } from 'react-native';
import { formatCurrency } from '../utils/currency';
import { COLORS } from '../config';

/**
 * Get common styles with theme colors applied
 * 
 * @param {object} theme - The current theme
 * @returns {object} - StyleSheet object with common styles
 */
export const getCommonStyles = (theme) => {
  return StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spaceBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    // Text styles
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 8,
    },
    heading: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
    },
    paragraph: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 16,
      lineHeight: 22,
    },
    small: {
      fontSize: 14,
      color: theme.textLight,
    },
    
    // Button styles
    button: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
    },
    buttonText: {
      color: theme.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
    secondaryButton: {
      backgroundColor: theme.white,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
    },
    secondaryButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    
    // Card styles
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      shadowColor: theme.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    // Input styles
    input: {
      backgroundColor: theme.white,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.text,
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textLight,
      marginBottom: 8,
    },
    
    // List item styles
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    
    // Balance styles
    balanceAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    positiveBalance: {
      color: theme.success,
    },
    negativeBalance: {
      color: theme.error,
    },
    neutralBalance: {
      color: theme.textLight,
    },
    
    // Expense styles
    expenseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      shadowColor: theme.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    
    // Helper styles
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 16,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignSelf: 'flex-start',
    },
    badgeText: {
      color: theme.white,
      fontSize: 12,
      fontWeight: '500',
    },

    // Cards and Items
    itemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    // Headers and Sections
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    sectionContainer: {
      marginBottom: 24,
    },
    
    // Text Styles
    body: {
      fontSize: 14,
      color: theme.textLight,
    },
    label: {
      fontSize: 14,
      color: theme.textLight,
      marginBottom: 4,
    },
    
    // Buttons
    linkButton: {
      padding: 8,
    },
    linkText: {
      color: theme.primary,
      fontWeight: 'bold',
    },
    
    // Icons and Avatars
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    
    // Empty States
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      marginBottom: 12,
    },
    emptyStateText: {
      marginVertical: 10,
      color: theme.textLight,
      textAlign: 'center',
    },
    
    // Summary Cards
    summaryCard: {
      backgroundColor: theme.primary,
      padding: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      alignItems: 'center',
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
  });
};

/**
 * Get style for balance values based on the amount
 * 
 * @param {number} amount - The balance amount
 * @param {object} theme - The current theme object
 * @returns {object} - Style object with appropriate color
 */
export const getBalanceStyle = (amount, theme) => {
  if (amount > 0) return { color: theme.success };
  if (amount < 0) return { color: theme.error };
  return { color: theme.textLight };
};

// Helper functions for common style combinations
export const combineStyles = (...styles) => {
  return styles.reduce((acc, style) => ({ ...acc, ...style }), {});
}; 