import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  SectionList,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../config';
import { getCommonStyles, getBalanceStyle } from '../styles/common';
import { isWeb } from '../utils/platform';
import { getWebStyles } from '../styles/webStyles';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalGroupBalance, setTotalGroupBalance] = useState(0);
  const [totalFriendBalance, setTotalFriendBalance] = useState(0);
  const { state } = useContext(AuthContext);
  const { theme, isDark } = useTheme();
  const { currency } = useCurrency();
  
  // Create memoized styles using the current theme
  const commonStyles = useMemo(() => getCommonStyles(theme), [theme]);
  const webStyles = useMemo(() => getWebStyles(theme), [theme]);

  const loadGroups = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/groups`);
      setGroups(response.data);

      // Calculate total balance across all groups
      const total = response.data.reduce((sum, group) => sum + group.balance, 0);
      setTotalGroupBalance(total);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/friends/balances`);
      setFriends(response.data);

      // Calculate total balance across all friends
      const total = response.data.reduce((sum, friend) => sum + friend.balance, 0);
      setTotalFriendBalance(total);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadGroups(), loadFriends()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();

    // Set up navigation listener to refresh data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const renderGroupItem = ({ item }) => {
    const ItemWrapper = isWeb ? ({ children }) => (
      <TouchableOpacity
        style={[webStyles.webCard]}
        onPress={() => navigation.navigate('Main', {
          screen: 'GroupsTab',
          params: {
            screen: 'GroupDetails',
            params: { groupId: item.id, groupName: item.name },
          },
        })}
      >
        {children}
      </TouchableOpacity>
    ) : ({ children }) => (
      <TouchableOpacity
        style={commonStyles.itemContainer}
        onPress={() => navigation.navigate('GroupsTab', {
          screen: 'GroupDetails',
          params: { groupId: item.id, groupName: item.name },
        })}
      >
        {children}
      </TouchableOpacity>
    );
    
    return (
      <ItemWrapper>
        <View style={{ flex: 1 }}>
          <Text style={commonStyles.subtitle}>{item.name}</Text>
          <Text style={commonStyles.body}>{item.member_count} members</Text>
        </View>
        <View>
          <Text
            style={[
              commonStyles.balanceAmount,
              getBalanceStyle(item.balance, theme)
            ]}
          >
            {item.balance > 0 ? '+' : ''}
            {formatCurrency(item.balance, currency)}
          </Text>
        </View>
      </ItemWrapper>
    );
  };

  const renderFriendItem = ({ item }) => {
    const ItemWrapper = isWeb ? ({ children }) => (
      <TouchableOpacity
        style={[webStyles.webCard]}
        onPress={() => navigation.navigate('Main', { 
          screen: 'FriendsTab', 
          params: {
            screen: 'UserExpenses', 
            params: { userId: item.id, userName: item.username }
          }
        })}
      >
        {children}
      </TouchableOpacity>
    ) : ({ children }) => (
      <TouchableOpacity
        style={commonStyles.itemContainer}
        onPress={() => navigation.navigate('FriendsTab', { 
          screen: 'UserExpenses', 
          params: { userId: item.id, userName: item.username }
        })}
      >
        {children}
      </TouchableOpacity>
    );
    
    return (
      <ItemWrapper>
        <View style={{ flex: 1 }}>
          <Text style={commonStyles.subtitle}>{item.username}</Text>
          {item.fullName && <Text style={commonStyles.body}>{item.fullName}</Text>}
        </View>
        <View>
          <Text
            style={[
              commonStyles.balanceAmount,
              getBalanceStyle(item.balance, theme)
            ]}
          >
            {item.balance > 0 ? '+' : ''}
            {formatCurrency(item.balance, currency)}
          </Text>
        </View>
      </ItemWrapper>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[commonStyles.centered, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator size="large" color />
      </View>
    );
  }

  const totalOverallBalance = totalGroupBalance + totalFriendBalance;

  // For web layout
  if (isWeb) {
    return (
      <ScrollView 
        style={{
          ...commonStyles.container,
          paddingHorizontal: 24,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        scrollbarWidth="none"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.primary]} 
          />
        }
      >
        <View style={[webStyles.webSummaryCard]}>
          <Text style={[styles.welcomeText, { color: theme.white }]}>
            Welcome, {state.user?.username || 'User'}!
          </Text>
          <View style={styles.balanceOverview}>
            <Text style={[styles.balanceLabel, { color: theme.white }]}>
              {totalOverallBalance >= 0 ? 'OVERALL BALANCE' : 'OVERALL BALANCE'}
            </Text>
            <Text
              style={[
                styles.totalBalance,
                { color: theme.white }
              ]}
            >
              {totalOverallBalance > 0 ? '+' : totalOverallBalance < 0 ? '-' : ''}
              {formatCurrency(Math.abs(totalOverallBalance), currency)}
            </Text>
          </View>
          
          <View style={[styles.balanceDetails, { justifyContent: 'center' }]}>
            <View style={[
              styles.balanceDetailItem, 
              {
                backgroundColor: theme.isDark
                  ? theme.gray  // Using more prominent gray in dark mode
                  : totalGroupBalance > 0 
                    ? 'rgba(46, 204, 113, 0.2)' 
                    : totalGroupBalance < 0 
                      ? 'rgba(231, 76, 60, 0.2)'
                      : 'rgba(255, 255, 255, 0.2)',
                width: '40%',
                marginHorizontal: 10
              }
            ]}>
              <View style={[styles.balanceDetailIcon, { backgroundColor: theme.primary }]}>
                <Ionicons 
                  name="people" 
                  size={18} 
                  color={theme.white} 
                />
              </View>
              <View style={styles.balanceDetailContent}>
                <Text style={[styles.balanceDetailLabel, { color: theme.white }]}>Groups</Text>
                <Text style={[styles.balanceDetailAmount, { color: theme.white }]}>
                  {totalGroupBalance > 0 ? '+' : totalGroupBalance < 0 ? '-' : ''}
                  {formatCurrency(Math.abs(totalGroupBalance), currency)}
                </Text>
              </View>
            </View>
            
            <View style={[
              styles.balanceDetailItem, 
              {
                backgroundColor: theme.isDark
                  ? theme.gray  // Using more prominent gray in dark mode
                  : totalFriendBalance > 0 
                    ? 'rgba(46, 204, 113, 0.2)' 
                    : totalFriendBalance < 0 
                      ? 'rgba(231, 76, 60, 0.2)'
                      : 'rgba(255, 255, 255, 0.2)',
                width: '40%',
                marginHorizontal: 10
              }
            ]}>
              <View style={[styles.balanceDetailIcon, { backgroundColor: theme.primary }]}>
                <Ionicons 
                  name="person" 
                  size={18} 
                  color={theme.white} 
                />
              </View>
              <View style={styles.balanceDetailContent}>
                <Text style={[styles.balanceDetailLabel, { color: theme.white }]}>Friends</Text>
                <Text style={[styles.balanceDetailAmount, { color: theme.white }]}>
                  {totalFriendBalance > 0 ? '+' : totalFriendBalance < 0 ? '-' : ''}
                  {formatCurrency(Math.abs(totalFriendBalance), currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[webStyles.webRow]}>
          <View style={[webStyles.webColumn]}>
            <View style={[commonStyles.sectionHeader, webStyles.webSectionHeader]}>
              <Text style={commonStyles.sectionTitle}>Your Groups</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Main', { 
                  screen: 'GroupsTab', 
                  params: { screen: 'MyGroups' } 
                })}
                style={commonStyles.linkButton}
              >
                <Text style={commonStyles.linkText}>View All</Text>
              </TouchableOpacity>
            </View>

            {groups.length === 0 ? (
              <View style={[commonStyles.emptyState, { marginBottom: 30 }]}>
                <Ionicons name="people-outline" size={50} color={theme.textLight} />
                <Text style={commonStyles.emptyStateText}>
                  You don't have any groups yet.
                </Text>
                <TouchableOpacity
                  style={[commonStyles.button, commonStyles.primaryButton, { marginTop: 8 }]}
                  onPress={() => navigation.navigate('Main', { 
                    screen: 'GroupsTab', 
                    params: { screen: 'MyGroups' } 
                  })}
                >
                  <Text style={commonStyles.buttonText}>Create Group</Text>
                </TouchableOpacity>
              </View>
            ) : (
              groups.map(item => (
                <View key={item.id} style={{ marginBottom: 16 }}>
                  {renderGroupItem({ item })}
                </View>
              ))
            )}
          </View>

          <View style={[webStyles.webColumn]}>
            <View style={[commonStyles.sectionHeader, webStyles.webSectionHeader]}>
              <Text style={commonStyles.sectionTitle}>Your Friends</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Main', { 
                  screen: 'FriendsTab', 
                  params: { screen: 'MyFriends' } 
                })}
                style={commonStyles.linkButton}
              >
                <Text style={commonStyles.linkText}>View All</Text>
              </TouchableOpacity>
            </View>

            {friends.length === 0 ? (
              <View style={[commonStyles.emptyState, { marginBottom: 30 }]}>
                <Ionicons name="person-outline" size={50} color={theme.textLight} />
                <Text style={commonStyles.emptyStateText}>
                  You don't have any friends yet.
                </Text>
                <TouchableOpacity
                  style={[commonStyles.button, commonStyles.primaryButton, { marginTop: 8 }]}
                  onPress={() => navigation.navigate('Main', { 
                    screen: 'FriendsTab', 
                    params: { screen: 'MyFriends' } 
                  })}
                >
                  <Text style={commonStyles.buttonText}>Add Friends</Text>
                </TouchableOpacity>
              </View>
            ) : (
              friends.map(item => (
                <View key={item.id} style={{ marginBottom: 16 }}>
                  {renderFriendItem({ item })}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  // Mobile layout
  return (
    <View style={[commonStyles.container, { paddingHorizontal: 16 }]}>
      <SectionList
        sections={[
          { title: 'summary', data: [{ isSummary: true }] },
          { title: 'groups', data: groups.length > 0 ? groups.slice(0, 3) : [{ isEmpty: true, type: 'group' }] },
          { title: 'friends', data: friends.length > 0 ? friends.slice(0, 3) : [{ isEmpty: true, type: 'friend' }] }
        ]}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item, section }) => {
          if (item.isSummary) {
            return (
              <View style={[styles.balanceSummary, { backgroundColor: theme.isDark ? theme.black : theme.primary }]}>
                <Text style={[styles.welcomeText, { color: theme.white }]}>
                  Welcome, {state.user?.username || 'User'}!
                </Text>
                <View style={styles.balanceOverview}>
                  <Text style={[styles.balanceLabel, { color: theme.white }]}>
                    {totalOverallBalance >= 0 ? 'OVERALL BALANCE' : 'OVERALL BALANCE'}
                  </Text>
                  <Text
                    style={[
                      styles.totalBalance,
                      { color: theme.white }
                    ]}
                  >
                    {totalOverallBalance > 0 ? '+' : totalOverallBalance < 0 ? '-' : ''}
                    {formatCurrency(Math.abs(totalOverallBalance), currency)}
                  </Text>
                </View>
                
                <View style={styles.balanceDetails}>
                  <View style={[
                    styles.balanceDetailItem, 
                    {
                      backgroundColor: theme.isDark
                        ? theme.gray  // Using more prominent gray in dark mode
                        : totalGroupBalance > 0 
                          ? 'rgba(46, 204, 113, 0.2)' 
                          : totalGroupBalance < 0 
                            ? 'rgba(231, 76, 60, 0.2)'
                            : 'rgba(255, 255, 255, 0.2)'
                    }
                  ]}>
                    <View style={[styles.balanceDetailIcon, { backgroundColor: theme.primary }]}>
                      <Ionicons 
                        name="people" 
                        size={18} 
                        color={theme.white} 
                      />
                    </View>
                    <View style={styles.balanceDetailContent}>
                      <Text style={[styles.balanceDetailLabel, { color: theme.white }]}>Groups</Text>
                      <Text style={[styles.balanceDetailAmount, { color: theme.white }]}>
                        {totalGroupBalance > 0 ? '+' : totalGroupBalance < 0 ? '-' : ''}
                        {formatCurrency(Math.abs(totalGroupBalance), currency)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.balanceDetailItem, 
                    {
                      backgroundColor: theme.isDark
                        ? theme.gray  // Using more prominent gray in dark mode
                        : totalFriendBalance > 0 
                          ? 'rgba(46, 204, 113, 0.2)' 
                          : totalFriendBalance < 0 
                            ? 'rgba(231, 76, 60, 0.2)'
                            : 'rgba(255, 255, 255, 0.2)'
                    }
                  ]}>
                    <View style={[styles.balanceDetailIcon, { backgroundColor: theme.primary }]}>
                      <Ionicons 
                        name="person" 
                        size={18} 
                        color={theme.white} 
                      />
                    </View>
                    <View style={styles.balanceDetailContent}>
                      <Text style={[styles.balanceDetailLabel, { color: theme.white }]}>Friends</Text>
                      <Text style={[styles.balanceDetailAmount, { color: theme.white }]}>
                        {totalFriendBalance > 0 ? '+' : totalFriendBalance < 0 ? '-' : ''}
                        {formatCurrency(Math.abs(totalFriendBalance), currency)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          } else if (item.isEmpty) {
            if (item.type === 'group') {
              return (
                <View style={commonStyles.emptyState}>
                  <Ionicons name="people-outline" size={50} color={theme.textLight} />
                  <Text style={commonStyles.emptyStateText}>
                    You don't have any groups yet.
                  </Text>
                  <TouchableOpacity
                    style={[commonStyles.button, commonStyles.primaryButton, { marginTop: 8 }]}
                    onPress={() => navigation.navigate('GroupsTab', { screen: 'MyGroups' })}
                  >
                    <Text style={commonStyles.buttonText}>Create Group</Text>
                  </TouchableOpacity>
                </View>
              );
            } else {
              return (
                <View style={commonStyles.emptyState}>
                  <Ionicons name="person-outline" size={50} color={theme.textLight} />
                  <Text style={commonStyles.emptyStateText}>
                    You don't have any friends yet.
                  </Text>
                  <TouchableOpacity
                    style={[commonStyles.button, commonStyles.primaryButton, { marginTop: 8 }]}
                    onPress={() => navigation.navigate('FriendsTab', { screen: 'MyFriends' })}
                  >
                    <Text style={commonStyles.buttonText}>Add Friends</Text>
                  </TouchableOpacity>
                </View>
              );
            }
          } else if (section.title === 'groups') {
            return renderGroupItem({ item });
          } else if (section.title === 'friends') {
            return renderFriendItem({ item });
          }
          
          return null;
        }}
        renderSectionHeader={({ section }) => {
          if (section.title === 'groups') {
            return (
              <View style={commonStyles.sectionContainer}>
                <View style={commonStyles.sectionHeader}>
                  <Text style={commonStyles.sectionTitle}>Your Groups</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('GroupsTab', { screen: 'MyGroups' })}
                    style={commonStyles.linkButton}
                  >
                    <Text style={commonStyles.linkText}>View All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          } else if (section.title === 'friends') {
            return (
              <View style={commonStyles.sectionContainer}>
                <View style={commonStyles.sectionHeader}>
                  <Text style={commonStyles.sectionTitle}>Your Friends</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('FriendsTab', { screen: 'MyFriends' })}
                    style={commonStyles.linkButton}
                  >
                    <Text style={commonStyles.linkText}>View All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
          return null;
        }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.primary]} 
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  balanceSummary: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    marginHorizontal: 0,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 12,
  },
  balanceOverview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalBalance: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  balanceDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  balanceDetailContent: {
    flex: 1,
  },
  balanceDetailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  balanceDetailAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreen; 