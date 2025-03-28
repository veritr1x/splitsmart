import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCommonStyles } from '../styles/common';

const FriendsScreen = ({ navigation }) => {
  const { state } = useContext(AuthContext);
  const { theme, isDark } = useTheme();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [searchingEmail, setSearchingEmail] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  
  // Create memoized styles using the current theme
  const commonStyles = useMemo(() => getCommonStyles(theme), [theme]);

  useEffect(() => {
    fetchFriends();
    
    // Refresh the list when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFriends();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/friends`, {
        headers: { Authorization: `Bearer ${state.userToken}` }
      });
      
      setFriends(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching friends:', error);
      Alert.alert('Error', 'Failed to load friends');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  };

  const handleAddFriend = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/users/friends`, 
        { friendId: userId },
        { headers: { Authorization: `Bearer ${state.userToken}` }}
      );
      
      setAddModalVisible(false);
      setEmailInput('');
      setFoundUser(null);
      fetchFriends();
      
      Alert.alert('Success', 'Friend added successfully');
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add friend');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/users/friends/${friendId}`, {
                headers: { Authorization: `Bearer ${state.userToken}` }
              });
              
              fetchFriends();
              Alert.alert('Success', 'Friend removed successfully');
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const handleUserPress = (user) => {
    navigation.navigate('UserExpenses', { userId: user.id, userName: user.username });
  };

  const handleAddExpense = (user) => {
    navigation.navigate('AddExpense', { 
      directUser: user,
      isDirectExpense: true
    });
  };

  const openAddFriendModal = () => {
    setAddModalVisible(true);
    setEmailInput('');
    setFoundUser(null);
  };

  const searchUserByEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setSearchingEmail(true);
    setFoundUser(null);

    try {
      console.log("Searching for email:", emailInput);
      
      const response = await axios.get(`${API_URL}/api/users/find-by-email`, {
        params: { email: emailInput.trim() },
        headers: { 
          Authorization: `Bearer ${state.userToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("User search response:", response.data);
      setFoundUser(response.data);
    } catch (error) {
      console.error('Error finding user:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert(
        'User Not Found', 
        error.response?.data?.message || 'Could not find user with this email'
      );
    } finally {
      setSearchingEmail(false);
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.fullName && friend.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.friendItem, { backgroundColor: theme.cardBackground }]} 
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.friendInfo}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.white }]}>
            {item.username?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={[styles.friendName, { color: theme.text }]}>{item.username}</Text>
          {item.fullName && (
            <Text style={[styles.friendFullName, { color: theme.textLight }]}>
              {item.fullName}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleAddExpense(item)}
        >
          <Ionicons name="add-circle" size={22} color={theme.primary} />
        </TouchableOpacity>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.textLight}
          style={styles.arrowIcon}
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
      <Ionicons name="people-outline" size={60} color={theme.textLight} />
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Friends Yet</Text>
      <Text style={[styles.emptyStateText, { color: theme.textLight }]}>
        Add friends to start splitting expenses together.
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
            placeholder="Search friends..."
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
        data={filteredFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={[
          filteredFriends.length === 0 ? styles.emptyListContent : { padding: 16 }, 
          { paddingBottom: 80 }
        ]}
        ListEmptyComponent={renderEmptyState}
      />

      <TouchableOpacity
        style={[styles.fab, { 
          backgroundColor: theme.isDark ? theme.black : theme.primary,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.isDark ? theme.border : 'transparent'
        }]}
        onPress={openAddFriendModal}
      >
        <Ionicons name="person-add" size={24} color={theme.white} />
      </TouchableOpacity>

      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add a Friend</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textLight} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubtitle, { color: theme.textLight }]}>
                Enter your friend's email address to find them
              </Text>

              <View style={styles.emailSearchContainer}>
                <TextInput
                  style={[styles.emailInput, { 
                    backgroundColor: isDark ? theme.gray : theme.lightGray,
                    color: theme.text,
                    borderColor: theme.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 5,
                    borderWidth: 1
                  }]}
                  placeholder="Enter email address"
                  placeholderTextColor={theme.textLight}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: theme.primary }]}
                  onPress={searchUserByEmail}
                  disabled={searchingEmail}
                >
                  {searchingEmail ? (
                    <ActivityIndicator size="small" color={theme.white} />
                  ) : (
                    <Text style={[styles.searchButtonText, { color: theme.white }]}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>

              {foundUser && (
                <View style={[styles.foundUserContainer, { borderColor: theme.border }]}>
                  <View style={styles.foundUserInfo}>
                    <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.avatarText, { color: theme.white }]}>
                        {foundUser.username?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.foundUserName, { color: theme.text }]}>
                        {foundUser.username}
                      </Text>
                      {foundUser.fullName && (
                        <Text style={[styles.foundUserFullName, { color: theme.textLight }]}>
                          {foundUser.fullName}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleAddFriend(foundUser.id)}
                  >
                    <Text style={[styles.addButtonText, { color: theme.white }]}>Add Friend</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  friendFullName: {
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
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
  modalOverlay: {
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
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  emailSearchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  emailInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  searchButton: {
    width: 80,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontWeight: 'bold',
  },
  foundUserContainer: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  foundUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  foundUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  foundUserFullName: {
    fontSize: 14,
  },
  addButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontWeight: 'bold',
  },
});

export default FriendsScreen; 