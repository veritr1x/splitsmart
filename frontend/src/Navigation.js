import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Auth Screens
import LoginScreen from './pages/auth/LoginScreen';
import RegisterScreen from './pages/auth/RegisterScreen';

// Main Screens
import DashboardScreen from './pages/DashboardScreen';
import GroupsScreen from './pages/GroupsScreen';
import GroupDetailsScreen from './pages/GroupDetailsScreen';
import AddExpenseScreen from './pages/AddExpenseScreen';
import ExpenseDetailsScreen from './pages/ExpenseDetailsScreen';
import SettleUpScreen from './pages/SettleUpScreen';
import ProfileScreen from './pages/ProfileScreen';
import FriendsScreen from './pages/FriendsScreen';
import UserExpensesScreen from './pages/UserExpensesScreen';

// Context
import { AuthContext } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';

// Custom components
import WebLayout from './components/WebLayout';
import { isWeb } from './utils/platform';
import { getWebStyles } from './styles/webStyles';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Web Navigation Header
const WebHeader = ({ navigation, title, showBackButton }) => {
  const { theme } = useTheme();
  const webStyles = getWebStyles(theme);
  const { state, signOut } = useContext(AuthContext);

  if (!isWeb || !state.userToken) return null;

  return (
    <View style={[webStyles.webNavContainer, { justifyContent: 'space-between' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.white} />
          </TouchableOpacity>
        )}
        <Text style={{ color: theme.white, fontSize: 20, fontWeight: 'bold' }}>
          {title || 'SplitSmart'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity 
          style={{ marginRight: 20 }}
          onPress={() => navigation.navigate('Main', { screen: 'Dashboard' })}
        >
          <Ionicons name="home" size={24} color={theme.white} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ marginRight: 20 }}
          onPress={() => navigation.navigate('Main', { screen: 'GroupsTab' })}
        >
          <Ionicons name="people" size={24} color={theme.white} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ marginRight: 20 }}
          onPress={() => navigation.navigate('Main', { screen: 'FriendsTab' })}
        >
          <Ionicons name="person" size={24} color={theme.white} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
        >
          <Ionicons name="settings" size={24} color={theme.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Auth Navigator
const AuthNavigator = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <WebLayout noPadding>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { 
            backgroundColor: theme.background,
            paddingTop: isWeb ? 0 : insets.top // Use insets for mobile, fixed value for web
          }
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </WebLayout>
  );
};

// Groups Stack Navigator
const GroupsStackNavigator = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <WebLayout noPadding>
      <Stack.Navigator
        screenOptions={({ navigation, route }) => ({
          header: props => isWeb ? 
            <WebHeader 
              navigation={navigation} 
              title={props.options.title} 
              showBackButton={true}
            /> : undefined,
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.white,
          contentStyle: { 
            backgroundColor: theme.background,
            paddingTop: 0 // Remove padding for both web and mobile since parent navigators handle it
          },
          cardStyle: { backgroundColor: theme.background },
          animationEnabled: true,
          animation: 'fade'
        })}
      >
        <Stack.Screen name="MyGroups" component={GroupsScreen} options={{ title: 'My Groups' }} />
        <Stack.Screen
          name="GroupDetails"
          component={GroupDetailsScreen}
          options={({ route }) => ({ title: route.params?.groupName || 'Group Details' })}
        />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
        <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} options={{ title: 'Expense Details' }} />
        <Stack.Screen name="SettleUp" component={SettleUpScreen} options={{ title: 'Settle Up' }} />
      </Stack.Navigator>
    </WebLayout>
  );
};

// Friends Stack Navigator
const FriendsStackNavigator = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <WebLayout noPadding>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          header: props => isWeb ? 
            <WebHeader 
              navigation={navigation} 
              title={props.options.title} 
              showBackButton={true}
            /> : undefined,
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.white,
          contentStyle: { 
            backgroundColor: theme.background,
            paddingTop: 0 // Remove padding for both web and mobile since parent navigators handle it
          },
          cardStyle: { backgroundColor: theme.background },
          animationEnabled: true,
          animation: 'fade'
        })}
      >
        <Stack.Screen name="MyFriends" component={FriendsScreen} options={{ title: 'Friends' }} />
        <Stack.Screen name="UserExpenses" component={UserExpensesScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
        <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} options={{ title: 'Expense Details' }} />
        <Stack.Screen name="SettleUp" component={SettleUpScreen} options={{ title: 'Settle Up' }} />
      </Stack.Navigator>
    </WebLayout>
  );
};

// Main Web Navigator
const WebMainNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        header: props => (
          <WebHeader 
            navigation={navigation} 
            title={props.options.title} 
            showBackButton={false}
          />
        ),
        contentStyle: { 
          backgroundColor: theme.background,
          paddingTop: 0 // Keep fixed padding for web
        },
      })}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen 
        name="GroupsTab" 
        component={GroupsStackNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="FriendsTab" 
        component={FriendsStackNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  if (isWeb) {
    // For web, use the web-specific navigator
    return (
      <WebLayout noPadding>
        <WebMainNavigator />
      </WebLayout>
    );
  }
  
  // For mobile, use the tab navigator
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'GroupsTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'FriendsTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isDark ? theme.white : theme.primary,
        tabBarInactiveTintColor: theme.textLight,
        tabBarStyle: { 
          backgroundColor: isDark ? theme.cardBackground : theme.white,
          borderTopColor: theme.border
        },
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.white,
        headerShown: false,
        contentStyle: { 
          backgroundColor: theme.background,
          paddingTop: isWeb ? 0 : insets.top // Use insets for mobile, fixed value for web
        },
        cardStyle: { backgroundColor: theme.background },
        animationEnabled: false
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupsStackNavigator}
        options={{ 
          headerShown: false,
          title: 'Groups'
        }}
      />
      <Tab.Screen
        name="FriendsTab"
        component={FriendsStackNavigator}
        options={{ 
          headerShown: false,
          title: 'Friends'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const Navigation = () => {
  const { state } = useContext(AuthContext);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Log the authentication state for debugging
  console.log('Navigation rendering with auth state:', {
    hasToken: !!state.userToken,
    isSignout: state.isSignout,
    isLoading: state.isLoading
  });

  // Force navigation reset on authentication state change
  const navKey = state.userToken ? 'auth' : 'noauth';

  return (
    <Stack.Navigator 
      key={navKey} 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { 
          backgroundColor: theme.background,
          paddingTop: isWeb ? 0 : insets.top // Use insets for mobile, fixed value for web
        },
        cardStyle: { backgroundColor: theme.background }
      }}
    >
      {state.userToken ? (
        <Stack.Screen 
          name="Main" 
          component={MainNavigator} 
          options={{ animationTypeForReplace: state.isSignout ? 'pop' : 'push' }}
        />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default Navigation; 