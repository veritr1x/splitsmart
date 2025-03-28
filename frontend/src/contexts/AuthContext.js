import React, { createContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

export const AuthContext = createContext();

// Initial state
const initialState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  user: null,
  error: null,
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        userToken: action.token,
        user: action.user,
        isLoading: false,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isSignout: false,
        userToken: action.token,
        user: action.user,
        error: null,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isSignout: true,
        userToken: null,
        user: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        error: action.error,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios default headers when token changes
  useEffect(() => {
    console.log('Token changed in state:', state.userToken ? 'Has token' : 'No token');
    
    if (state.userToken) {
      console.log('Setting axios auth header');
      axios.defaults.headers.common['x-auth-token'] = state.userToken;
    } else {
      console.log('Removing axios auth header');
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, [state.userToken]);

  // Check if user is already logged in
  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken = null;
      let user = null;

      try {
        userToken = await AsyncStorage.getItem('userToken');
        const userJson = await AsyncStorage.getItem('user');
        
        if (userJson) {
          user = JSON.parse(userJson);
        }

        if (userToken) {
          // Set axios header for future requests
          axios.defaults.headers.common['x-auth-token'] = userToken;
          
          // Verify token validity
          try {
            const response = await axios.get(`${API_URL}/api/auth/me`);
            user = response.data;
            await AsyncStorage.setItem('user', JSON.stringify(user));
          } catch (error) {
            // If token is invalid, clear storage
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('user');
            userToken = null;
            user = null;
          }
        }
      } catch (e) {
        console.error('Error restoring token:', e);
      }

      dispatch({ type: 'RESTORE_TOKEN', token: userToken, user });
    };

    bootstrapAsync();
  }, []);

  // Auth actions
  const authActions = {
    signIn: async (email, password) => {
      try {
        dispatch({ type: 'CLEAR_ERROR' });
        const response = await axios.post(`${API_URL}/api/auth/login`, {
          email,
          password,
        });

        const { token, user } = response.data;

        // First, set the token for immediate use in axios
        axios.defaults.headers.common['x-auth-token'] = token;

        // Then update the storage and state
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        dispatch({ type: 'SIGN_IN', token, user });
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
        dispatch({ type: 'AUTH_ERROR', error: errorMessage });
      }
    },
    register: async (name, email, username, password) => {
      try {
        console.log('Attempting to register user...');
        dispatch({ type: 'CLEAR_ERROR' });

        const userData = {
          username,
          email,
          fullName: name,
          password
        };

        const response = await axios.post(`${API_URL}/api/auth/register`, userData);
        console.log('Registration response received:', response.data);

        const { token, user } = response.data;

        // First, set the token for immediate use in axios
        axios.defaults.headers.common['x-auth-token'] = token;

        // Then update the storage and state
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        dispatch({ type: 'SIGN_IN', token, user });
      } catch (error) {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = error.message || errorMessage;
        }
        
        dispatch({ type: 'AUTH_ERROR', error: errorMessage });
        throw error; // Re-throw to handle in the component
      }
    },
    signOut: async () => {
      try {
        console.log('Signing out: Removing token from storage');
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user');
        
        console.log('Signing out: Clearing auth headers');
        delete axios.defaults.headers.common['x-auth-token'];
        
        console.log('Signing out: Dispatching SIGN_OUT action');
        dispatch({ type: 'SIGN_OUT' });
        
        console.log('Sign out completed');
      } catch (error) {
        console.error('Error during sign out:', error);
        // Still attempt to clear state even if there was an error
        dispatch({ type: 'SIGN_OUT' });
      }
    },
    clearError: () => {
      dispatch({ type: 'CLEAR_ERROR' });
    },
    updateUser: (user) => {
      AsyncStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'RESTORE_TOKEN', token: state.userToken, user });
    },
  };

  return (
    <AuthContext.Provider value={{ state, ...authActions }}>
      {children}
    </AuthContext.Provider>
  );
};