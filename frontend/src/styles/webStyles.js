import { StyleSheet } from 'react-native';

export const getWebStyles = (theme) => StyleSheet.create({
  // Web-specific container styles
  webContainer: {
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
  },
  
  // Two-column layout for larger screens
  webRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
  },
  
  webColumn: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    width: '50%',
  },
  
  // Enhanced card styles for web
  webCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
  },
  
  webCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  
  // Web-specific dashboard summary card
  webSummaryCard: {
    backgroundColor: theme.isDark ? theme.black : theme.primary,
    borderRadius: 20,
    padding: 30,
    marginTop: 16,
    marginHorizontal: 0,
    marginBottom: 30,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: theme.isDark ? theme.border : 'rgba(255, 255, 255, 0.1)',
  },
  
  // Web-specific section headers
  webSectionHeader: {
    paddingBottom: 10,
    marginBottom: 20,
    borderBottom: `1px solid ${theme.border}`,
  },
  
  // Web navigation and header styles
  webNavContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: theme.isDark ? theme.black : theme.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  
  webButtonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },

  webButton: {
    backgroundColor: theme.isDark ? theme.black : theme.primary,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
    transition: 'background-color 0.2s ease',
    marginLeft: 10,
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: theme.isDark ? theme.border : 'transparent',
  },
  
  webButtonText: {
    color: theme.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Web form styles
  webForm: {
    maxWidth: 600,
    width: '100%',
    margin: '0 auto',
    padding: 30,
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  },
  
  webInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    backgroundColor: theme.background,
    fontSize: 16,
  },
  
  // Web list items
  webListItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    transition: 'background-color 0.2s ease',
  },
  
  webListItemHover: {
    backgroundColor: theme.lightGray,
  },
}); 