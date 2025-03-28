import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import { useTheme } from '../contexts/ThemeContext';
import { getCommonStyles, getBalanceStyle } from '../styles/common';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/currency';

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupBalance, setGroupBalance] = useState(0);
  const { theme } = useTheme();
  const { currency } = useCurrency();
  
  // Create memoized styles using the current theme
  const commonStyles = useMemo(() => getCommonStyles(theme), [theme]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      // Get expenses for the group
      const expensesResponse = await axios.get(`${API_URL}/api/expenses/group/${groupId}`);
      setExpenses(expensesResponse.data);

      // Get group balance from the first API call
      const groups = await axios.get(`${API_URL}/api/users/groups`);
      const currentGroup = groups.data.find(group => group.id === parseInt(groupId));
      if (currentGroup) {
        setGroupBalance(currentGroup.balance || 0);
      }

      // Extract unique members from expenses
      const uniqueMembers = {};
      expensesResponse.data.forEach(expense => {
        // Add payer
        uniqueMembers[expense.paid_by] = expense.payer_name;
        
        // Add all users from shares
        expense.shares.forEach(share => {
          uniqueMembers[share.user_id] = share.username;
        });
      });

      const membersList = Object.keys(uniqueMembers).map(id => ({
        id: parseInt(id),
        username: uniqueMembers[id],
      }));

      setMembers(membersList);
    } catch (error) {
      console.error('Error loading group data:', error);
      Alert.alert('Error', 'Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();

    // Refresh data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadGroupData();
    });

    return unsubscribe;
  }, [navigation, groupId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  const renderExpenseItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.expenseItem, { backgroundColor: theme.cardBackground }]}
      onPress={() => navigation.navigate('ExpenseDetails', { expenseId: item.id })}
    >
      <View style={styles.expenseInfo}>
        <Text style={[styles.expenseDescription, { color: theme.text }]}>{item.description}</Text>
        <Text style={[styles.expenseDate, { color: theme.textLight }]}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.expensePayerInfo}>
        <Text style={[styles.expensePayer, { color: theme.textLight }]}>Paid by {item.payer_name}</Text>
        <Text style={[styles.expenseAmount, { color: theme.text }]}>
          {formatCurrency(parseFloat(item.amount), currency)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
      <Ionicons name="receipt-outline" size={60} color={theme.textLight} />
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Expenses Yet</Text>
      <Text style={[styles.emptyStateText, { color: theme.textLight }]}>
        Add an expense to start splitting bills with your group members.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[commonStyles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.isDark ? theme.white : theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.balanceCard, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.balanceTitle, { color: theme.textLight }]}>
          {groupBalance >= 0 ? 'You are owed' : 'You owe'}
        </Text>
        <Text
          style={[
            styles.balanceAmount,
            getBalanceStyle(groupBalance, theme)
          ]}
        >
          {formatCurrency(Math.abs(groupBalance), currency)}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addExpenseButton, { 
            backgroundColor: theme.isDark ? theme.black : theme.primary,
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.isDark ? theme.border : 'transparent'
          }]}
          onPress={() => navigation.navigate('AddExpense', { groupId, members })}
        >
          <Ionicons name="add" size={24} color={theme.isDark ? theme.text : theme.white} />
          <Text style={[styles.actionButtonText, { color: theme.isDark ? theme.text : theme.white }]}>Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.settleButton, { 
            backgroundColor: theme.isDark ? theme.secondary : theme.secondary,
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.isDark ? theme.border : 'transparent'
          }]}
          onPress={() => navigation.navigate('SettleUp', { groupId, members })}
        >
          <Ionicons name="checkmark-done" size={24} color={theme.isDark ? theme.text : theme.white} />
          <Text style={[styles.actionButtonText, { color: theme.isDark ? theme.text : theme.white }]}>Settle Up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.expensesContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Expenses</Text>

        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmptyList}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={expenses.length === 0 && styles.emptyListContent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  addExpenseButton: {
    // Theme color applied in component
  },
  settleButton: {
    // Theme color applied in component
  },
  actionButtonText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  expensesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseInfo: {
    flex: 2,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
  },
  expensePayerInfo: {
    flex: 1.5,
    alignItems: 'flex-end',
    marginRight: 8,
  },
  expensePayer: {
    fontSize: 14,
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default GroupDetailsScreen; 