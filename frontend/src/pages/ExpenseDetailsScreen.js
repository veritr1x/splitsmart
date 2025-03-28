import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API_URL, COLORS } from '../config';
import { useTheme } from '../contexts/ThemeContext';
import { getCommonStyles } from '../styles/common';

const ExpenseDetailsScreen = ({ route, navigation }) => {
  const { expenseId } = route.params;
  const { state } = useContext(AuthContext);
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const commonStyles = useMemo(() => getCommonStyles(theme), [theme]);

  useEffect(() => {
    fetchExpenseDetails();
  }, [expenseId]);

  const fetchExpenseDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/expenses/${expenseId}`);
      setExpense(response.data);
    } catch (error) {
      console.error('Error fetching expense details:', error);
      Alert.alert('Error', 'Failed to load expense details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDeleteExpense },
      ]
    );
  };

  const confirmDeleteExpense = async () => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/expenses/${expenseId}`);
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.isDark ? theme.white : theme.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>Expense not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCurrentUserPayer = expense.paid_by === state.user?.id;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.date}>
            {new Date(expense.date).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amount}>${parseFloat(expense.amount).toFixed(2)}</Text>
        </View>

        <View style={styles.payerContainer}>
          <Text style={styles.payerLabel}>Paid by</Text>
          <Text style={styles.payer}>
            {expense.payer_name}
            {isCurrentUserPayer ? ' (You)' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Shares</Text>
        {expense.shares.map((share) => (
          <View key={share.id} style={styles.shareItem}>
            <View style={styles.shareUser}>
              <Text style={styles.shareName}>
                {share.username}
                {share.user_id === state.user?.id ? ' (You)' : ''}
              </Text>
            </View>
            <View style={styles.shareAmountContainer}>
              <Text
                style={[
                  styles.shareAmount,
                  share.is_settled ? styles.settledAmount : {},
                ]}
              >
                ${parseFloat(share.amount).toFixed(2)}
              </Text>
              {share.is_settled && (
                <View style={styles.settledBadge}>
                  <Text style={styles.settledText}>Settled</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.groupContainer}>
        <Text style={styles.groupLabel}>Group</Text>
        <Text style={styles.groupName}>{expense.group_name}</Text>
      </View>

      {isCurrentUserPayer && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('AddExpense', {
              groupId: expense.group_id,
              expenseToEdit: expense,
            })}
          >
            <Ionicons name="pencil" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteExpense}
          >
            <Ionicons name="trash" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  description: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  amountLabel: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  payerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payerLabel: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  payer: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  shareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  shareUser: {
    flex: 1,
  },
  shareName: {
    fontSize: 16,
    color: COLORS.text,
  },
  shareAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginRight: 8,
  },
  settledAmount: {
    textDecorationLine: 'line-through',
    color: COLORS.textLight,
  },
  settledBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  settledText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  groupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupLabel: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 0,
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
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ExpenseDetailsScreen; 