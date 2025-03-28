import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency, parseCurrencyValue } from '../utils/currency';
import { API_URL } from '../config';
import { getCommonStyles } from '../styles/common';

const AddExpenseScreen = ({ route, navigation }) => {
  const { groupId, members = [], directUser, isDirectExpense = false } = route.params;
  const { state } = useContext(AuthContext);
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [customShares, setCustomShares] = useState({});
  
  // Create memoized styles using the current theme
  const commonStyles = useMemo(() => getCommonStyles(theme), [theme]);

  useEffect(() => {
    // Prepare group members data
    let membersData = [...members];
    
    // For direct expense, just include the current user and the direct user
    if (isDirectExpense && directUser) {
      membersData = [
        { id: state.user.id, username: state.user.username },
        directUser
      ];
    }
    
    // Make sure current user is included
    if (!membersData.some(m => m.id === state.user.id)) {
      membersData = [
        { id: state.user.id, username: state.user.username },
        ...membersData
      ];
    }
    
    // Initialize with empty custom shares
    let initialShares = {};
    membersData.forEach(member => {
      initialShares[member.id] = 0;
    });
    
    setGroupMembers(membersData);
    setCustomShares(initialShares);
  }, [members, state.user.id, state.user.username, directUser, isDirectExpense]);

  const calculateEqualShare = () => {
    if (!amount || parseFloat(amount) === 0 || groupMembers.length === 0) {
      return 0;
    }
    return parseFloat(amount) / groupMembers.length;
  };

  const handleCustomShareChange = (memberId, value) => {
    // Parse the value removing any currency symbols
    const numericValue = parseCurrencyValue(value);
    
    setCustomShares({
      ...customShares,
      [memberId]: numericValue
    });
  };

  const validateCustomShares = () => {
    if (!amount || parseFloat(amount) === 0) return false;
    
    const total = Object.values(customShares).reduce((sum, share) => sum + share, 0);
    return Math.abs(total - parseFloat(amount)) < 0.01; // Allow small rounding errors
  };

  const handleCreateExpense = async () => {
    if (!description) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!splitEqually && !validateCustomShares()) {
      Alert.alert('Error', 'Custom shares must add up to the total amount');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare shares data
      const shares = groupMembers.map(member => {
        let shareAmount;
        
        if (splitEqually) {
          shareAmount = calculateEqualShare();
        } else {
          shareAmount = customShares[member.id] || 0;
        }
        
        return {
          userId: member.id,
          amount: shareAmount
        };
      });

      // Create expense data
      const expenseData = {
        description,
        amount: parseFloat(amount),
        paidBy: state.user.id,
        groupId: isDirectExpense ? null : groupId,
        shares
      };

      // Send request to create expense
      await axios.post(`${API_URL}/api/expenses`, expenseData, {
        headers: { Authorization: `Bearer ${state.userToken}` }
      });

      // Show success message and navigate back
      Alert.alert(
        'Success', 
        `Expense of ${formatCurrency(parseFloat(amount), currency)} added successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating expense:', error);
      Alert.alert('Error', 'Failed to create expense');
      setLoading(false);
    }
  };

  const renderMemberItem = (member) => {
    const isCurrentUser = member.id === state.user.id;
    const equalShare = calculateEqualShare();
    
    return (
      <View 
        key={member.id}
        style={[
          styles.memberItem, 
          { borderBottomColor: theme.border }
        ]}
      >
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: theme.text }]}>
            {member.username}
          </Text>
          {isCurrentUser && (
            <Text style={[styles.youLabel, { color: theme.textLight }]}>(You)</Text>
          )}
        </View>
        
        {splitEqually ? (
          <Text style={[styles.equalShare, { color: theme.text }]}>
            {formatCurrency(equalShare, currency)}
          </Text>
        ) : (
          <TextInput
            style={[
              styles.customShareInput, 
              { 
                borderColor: theme.border,
                backgroundColor: theme.isDark ? theme.background : theme.lightGray,
                color: theme.text 
              }
            ]}
            value={customShares[member.id] ? customShares[member.id].toString() : ''}
            onChangeText={(value) => handleCustomShareChange(member.id, value)}
            placeholder="0.00"
            placeholderTextColor={theme.textLight}
            keyboardType="decimal-pad"
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
      keyboardVerticalOffset={100}
    >
      <ScrollView>
        <View style={styles.form}>
          <View style={[styles.inputContainer, { borderBottomColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.textLight }]}>Description</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="What is this expense for?"
              placeholderTextColor={theme.textLight}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={[styles.inputContainer, { borderBottomColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.textLight }]}>Amount</Text>
            <View style={styles.amountInputContainer}>
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
          </View>

          <View style={[styles.inputContainer, { borderBottomColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.textLight }]}>Paid by</Text>
            <Text style={[styles.paidByText, { color: theme.text }]}>
              {state.user?.username || 'You'} (can't change)
            </Text>
          </View>

          <View style={styles.splitOptions}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Split options</Text>
            
            <View style={styles.splitToggle}>
              <Text style={[styles.splitToggleLabel, { color: theme.text }]}>Split equally</Text>
              <Switch
                value={splitEqually}
                onValueChange={setSplitEqually}
                trackColor={{ false: theme.gray, true: theme.primary }}
                thumbColor={theme.white}
              />
            </View>
            
            <View style={styles.membersContainer}>
              <Text style={[styles.membersTitle, { color: theme.textLight }]}>
                {splitEqually ? 'Equal split between' : 'Custom split amounts'}
              </Text>
              
              {groupMembers.map(renderMemberItem)}
              
              {!splitEqually && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: theme.text }]}>Total:</Text>
                  <Text 
                    style={[
                      styles.totalAmount, 
                      { 
                        color: validateCustomShares() ? theme.success : theme.error 
                      }
                    ]}
                  >
                    {formatCurrency(Object.values(customShares).reduce((sum, share) => sum + share, 0), currency)}
                    {amount && ` / ${formatCurrency(parseFloat(amount), currency)}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: theme.primary }
            ]}
            onPress={handleCreateExpense}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.white} size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={24} color={theme.white} />
                <Text style={[styles.createButtonText, { color: theme.white }]}>
                  Add Expense
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
    paddingBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  paidByText: {
    fontSize: 16,
  },
  splitOptions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  splitToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  splitToggleLabel: {
    fontSize: 16,
  },
  membersContainer: {
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
  },
  youLabel: {
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  equalShare: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customShareInput: {
    width: 80,
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 16,
    borderWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  createButton: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddExpenseScreen; 