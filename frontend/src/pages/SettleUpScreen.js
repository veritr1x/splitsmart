import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import { API_URL } from '../config';
import { getCommonStyles, getBalanceStyle } from '../styles/common';

const SettleUpScreen = ({ route, navigation }) => {
  const { groupId, members = [], userId, userName, amount: initialAmount, isDirectSettlement = false } = route.params;
  const { state } = useContext(AuthContext);
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const [amount, setAmount] = useState(initialAmount ? initialAmount.toFixed(2) : '');
  const [balances, setBalances] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(!isDirectSettlement);
  const [settling, setSettling] = useState(false);
  
  // Create memoized styles using the current theme
  const commonStyles = useMemo(() => getCommonStyles(theme), [theme]);

  useEffect(() => {
    // If direct settlement, preset the user
    if (isDirectSettlement && userId && userName) {
      setSelectedUser({
        userId,
        username: userName,
        amount: initialAmount || 0
      });
    } else {
      fetchBalances();
    }
  }, [groupId, isDirectSettlement, userId, userName, initialAmount]);

  const fetchBalances = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/${groupId}/balances`, {
        headers: { Authorization: `Bearer ${state.userToken}` }
      });

      // Filter out users with zero balance and current user
      const filteredBalances = response.data
        .filter(balance => 
          balance.userId !== state.user.id && 
          balance.balance !== 0
        )
        .map(balance => ({
          userId: balance.userId,
          username: balance.username,
          balance: balance.balance
        }));

      setBalances(filteredBalances);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching balances:', error);
      Alert.alert('Error', 'Failed to load balances');
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setAmount(Math.abs(user.balance).toFixed(2));
  };

  const handleSettleUp = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!selectedUser && !isDirectSettlement) {
      Alert.alert('Select User', 'Please select a user to settle up with');
      return;
    }

    try {
      setSettling(true);
      
      const settlementData = {
        amount: parseFloat(amount),
        userId: isDirectSettlement ? userId : selectedUser.userId,
        groupId: groupId || null
      };

      await axios.post(`${API_URL}/api/settlements`, settlementData, {
        headers: { Authorization: `Bearer ${state.userToken}` }
      });

      Alert.alert(
        'Success', 
        `Payment of ${formatCurrency(parseFloat(amount), currency)} recorded successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error settling up:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setSettling(false);
    }
  };

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUser && selectedUser.userId === item.userId;
    
    return (
      <TouchableOpacity
        style={[
          styles.userItem, 
          { 
            backgroundColor: isSelected 
              ? theme.isDark ? theme.gray : theme.lightGray
              : theme.cardBackground
          }
        ]}
        onPress={() => handleUserSelect(item)}
      >
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text 
            style={[
              styles.balanceAmount, 
              getBalanceStyle(item.balance, theme)
            ]}
          >
            {item.balance > 0 
              ? `They owe you ${formatCurrency(item.balance, currency)}` 
              : `You owe ${formatCurrency(Math.abs(item.balance), currency)}`
            }
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cash-outline" size={60} color={theme.textLight} />
        <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Debts to Settle</Text>
        <Text style={[styles.emptyStateText, { color: theme.textLight }]}>
          There are no outstanding balances between you and other group members.
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[commonStyles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.isDark ? theme.white : theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Settle Up</Text>
      
      {isDirectSettlement ? null : (
        <View style={styles.selectUserSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select User</Text>
          <FlatList
            data={balances}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.userId.toString()}
            ListEmptyComponent={renderEmptyList}
            contentContainerStyle={balances.length === 0 && styles.emptyListContent}
          />
        </View>
      )}
      
      <View style={[styles.settleSection, { borderTopColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {selectedUser || isDirectSettlement ? `Pay ${isDirectSettlement ? userName : selectedUser?.username}` : 'Enter Payment Details'}
        </Text>
        
        <View style={[styles.amountContainer, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.currencySymbol, { color: theme.text }]}>{currency.symbol}</Text>
          <TextInput
            style={[styles.amountInput, { color: theme.text }]}
            placeholder="0.00"
            placeholderTextColor={theme.textLight}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.settleButton, { 
            backgroundColor: theme.isDark ? theme.black : theme.primary,
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.isDark ? theme.border : 'transparent' 
          }]}
          onPress={handleSettleUp}
          disabled={settling || (!selectedUser && !isDirectSettlement)}
        >
          {settling ? (
            <ActivityIndicator color={theme.isDark ? theme.text : theme.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color={theme.isDark ? theme.text : theme.white} />
              <Text style={[styles.settleButtonText, { color: theme.isDark ? theme.text : theme.white }]}>
                {isDirectSettlement ? 'Record Payment' : 'Settle Up'}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  selectUserSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settleSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 18,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 18,
  },
  settleButton: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settleButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    padding: 16,
  },
});

export default SettleUpScreen; 