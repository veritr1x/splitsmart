import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, COLORS } from '../config';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCommonStyles, getBalanceStyle } from '../styles/common';

const UserExpensesScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const { state } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ youOwe: 0, theyOwe: 0, netBalance: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const { theme } = useTheme();
  const commonStyles = useMemo(() => getCommonStyles(theme), [theme]);

  useEffect(() => {
    fetchExpenses();

    // Set the screen title with the username
    navigation.setOptions({ title: `Expenses with ${userName}` });
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/expenses/user/${userId}`, {
        headers: { Authorization: `Bearer ${state.userToken}` }
      });
      
      setExpenses(response.data);
      calculateSummary(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
      setLoading(false);
    }
  };

  const calculateSummary = (expenseData) => {
    let youOwe = 0;
    let theyOwe = 0;

    expenseData.forEach(expense => {
      // Expense shares that belong to the current user where someone else paid
      const currentUserShares = expense.shares.filter(
        share => share.user_id === state.user.id && expense.paid_by !== state.user.id
      );
      
      // Expense shares that belong to the other user where the current user paid
      const otherUserShares = expense.shares.filter(
        share => share.user_id === userId && expense.paid_by === state.user.id
      );
      
      // Calculate what the current user owes
      currentUserShares.forEach(share => {
        if (!share.is_settled) {
          youOwe += parseFloat(share.amount);
        }
      });
      
      // Calculate what the other user owes
      otherUserShares.forEach(share => {
        if (!share.is_settled) {
          theyOwe += parseFloat(share.amount);
        }
      });
    });

    const netBalance = theyOwe - youOwe;
    setSummary({ youOwe, theyOwe, netBalance });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', { 
      directUser: { id: userId, username: userName },
      isDirectExpense: true
    });
  };

  const handleSettleUp = () => {
    // Determine the direction and amount based on who owes whom
    let settleAmount = 0;
    let toUserId = null;
    
    if (summary.netBalance > 0) {
      // They owe you
      settleAmount = summary.netBalance;
      toUserId = state.user.id;
    } else if (summary.netBalance < 0) {
      // You owe them
      settleAmount = Math.abs(summary.netBalance);
      toUserId = userId;
    } else {
      // No debt
      Alert.alert('Nothing to settle', 'There are no debts to settle between you.');
      return;
    }
    
    navigation.navigate('SettleUp', {
      userId,
      userName,
      amount: settleAmount,
      isDirectSettlement: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderExpenseItem = ({ item }) => {
    const isPaidByCurrentUser = item.paid_by === state.user.id;
    const payer = isPaidByCurrentUser ? 'You' : userName;
    
    // Calculate amount for the current user
    const userShare = item.shares.find(share => share.user_id === state.user.id);
    const userAmount = userShare ? parseFloat(userShare.amount) : 0;
    
    return (
      <TouchableOpacity 
        style={styles.expenseItem}
        onPress={() => navigation.navigate('ExpenseDetails', { expenseId: item.id })}
      >
        <View style={styles.expenseLeft}>
          <Text style={commonStyles.subtitle}>{item.description}</Text>
          <Text style={commonStyles.small}>{formatDate(item.date)}</Text>
          <Text style={commonStyles.small}>Paid by {payer}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={commonStyles.balanceAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
          <Text style={[
            commonStyles.small, 
            isPaidByCurrentUser ? commonStyles.positiveBalance : commonStyles.negativeBalance
          ]}>
            {isPaidByCurrentUser ? '+' : '-'}${userAmount.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.isDark ? theme.white : theme.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>You owe</Text>
          <Text style={[commonStyles.balanceAmount, getBalanceStyle(-summary.youOwe)]}>
            ${summary.youOwe.toFixed(2)}
          </Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>You are owed</Text>
          <Text style={[commonStyles.balanceAmount, getBalanceStyle(summary.theyOwe)]}>
            ${summary.theyOwe.toFixed(2)}
          </Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Net balance</Text>
          <Text style={[commonStyles.balanceAmount, getBalanceStyle(summary.netBalance)]}>
            {summary.netBalance > 0 ? '+' : ''}${summary.netBalance.toFixed(2)}
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[commonStyles.button, commonStyles.primaryButton, styles.actionButton]}
          onPress={handleAddExpense}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={commonStyles.buttonText}>Add Expense</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            commonStyles.button, 
            styles.actionButton,
            styles.settleButton, 
            summary.netBalance === 0 && styles.disabledButton
          ]}
          onPress={handleSettleUp}
          disabled={summary.netBalance === 0}
        >
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={commonStyles.buttonText}>Settle Up</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpenseItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={commonStyles.emptyState}>
            <Text style={commonStyles.emptyStateText}>No expenses with {userName} yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: COLORS.white,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  balanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  settleButton: {
    backgroundColor: COLORS.success,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  expenseItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 1,
  },
  expenseLeft: {
    flex: 3,
  },
  expenseRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserExpensesScreen; 