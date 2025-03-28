import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../config';
import { getCommonStyles, getBalanceStyle } from '../styles/common';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/currency';

const GroupsScreen = ({ navigation }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, isDark } = useTheme();
  const { currency } = useCurrency();
  
  // Create memoized styles using the current theme
  const commonStyles = useMemo(() => getCommonStyles(theme), [theme]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/groups`);
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/users/groups`, {
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
      });

      setModalVisible(false);
      setNewGroupName('');
      setNewGroupDescription('');
      
      // Navigate to the newly created group
      const newGroup = response.data;
      navigation.navigate('GroupDetails', {
        groupId: newGroup.id,
        groupName: newGroup.name,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.groupItem, { backgroundColor: theme.cardBackground }]}
      onPress={() => navigation.navigate('GroupDetails', {
        groupId: item.id,
        groupName: item.name,
      })}
    >
      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, { color: theme.text }]}>{item.name}</Text>
        {item.description ? (
          <Text style={[styles.groupDescription, { color: theme.textLight }]} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
        <Text style={[styles.memberCount, { color: theme.textLight }]}>
          {item.member_count} members
        </Text>
      </View>
      <View style={styles.balanceContainer}>
        <Text
          style={[
            styles.balanceAmount,
            getBalanceStyle(item.balance, theme)
          ]}
        >
          {item.balance > 0 ? '+' : ''}
          {formatCurrency(item.balance, currency)}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.textLight}
          style={styles.arrowIcon}
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
      <Ionicons name="people-outline" size={60} color={theme.textLight} />
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Groups Yet</Text>
      <Text style={[styles.emptyStateText, { color: theme.textLight }]}>
        Create a group to start splitting expenses with friends.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[commonStyles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={styles.loader} size="large" color={theme.isDark ? theme.white : theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <View style={[styles.searchContainer, { 
          backgroundColor: theme.cardBackground,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
          borderWidth: 1,
          borderColor: theme.border,
          marginHorizontal: 8,
          borderRadius: 12,
          height: 52
        }]}>
          <Ionicons name="search" size={22} color={theme.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text, fontSize: 16 }]}
            placeholder="Search groups..."
            placeholderTextColor={theme.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredGroups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          groups.length === 0 ? styles.emptyListContent : { paddingHorizontal: 16, paddingTop: 16 },
          { paddingBottom: 80 }
        ]}
        ListEmptyComponent={renderEmptyList}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <TouchableOpacity
        style={[styles.fab, { 
          backgroundColor: theme.isDark ? theme.black : theme.primary,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.isDark ? theme.border : 'transparent'
        }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color={theme.isDark ? theme.white : theme.white} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Create New Group</Text>
              
              <Text style={[styles.inputLabel, { color: theme.text }]}>Group Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? theme.background : theme.lightGray,
                  color: theme.text,
                  borderColor: theme.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 5
                }]}
                placeholder="Enter group name"
                placeholderTextColor={theme.textLight}
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
              
              <Text style={[styles.inputLabel, { color: theme.text }]}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: isDark ? theme.background : theme.lightGray,
                  color: theme.text,
                  borderColor: theme.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 5
                }]}
                placeholder="Enter description"
                placeholderTextColor={theme.textLight}
                value={newGroupDescription}
                onChangeText={setNewGroupDescription}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { 
                    backgroundColor: isDark ? theme.gray : theme.lightGray 
                  }]}
                  onPress={() => {
                    setModalVisible(false);
                    setNewGroupName('');
                    setNewGroupDescription('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.createButton, { backgroundColor: theme.primary }]}
                  onPress={handleCreateGroup}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  groupItem: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
  },
  createButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GroupsScreen; 