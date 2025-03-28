import React, { createContext, useReducer, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create currency context
export const CurrencyContext = createContext();

// Available currencies
export const Currencies = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound'
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen'
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee'
  }
};

// Initial state
const initialState = {
  currency: Currencies.USD,
  isLoading: true,
};

// Reducer function
const currencyReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENCY':
      return {
        ...state,
        currency: action.currency,
        isLoading: false,
      };
    case 'RESTORE_CURRENCY':
      return {
        ...state,
        currency: action.currency,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Currency provider component
export const CurrencyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(currencyReducer, initialState);

  // Load saved currency on mount
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const savedCurrency = await AsyncStorage.getItem('currency');
        if (savedCurrency) {
          dispatch({ 
            type: 'RESTORE_CURRENCY', 
            currency: JSON.parse(savedCurrency),
          });
        } else {
          // Use USD as default if no saved preference
          dispatch({ 
            type: 'RESTORE_CURRENCY', 
            currency: Currencies.USD,
          });
        }
      } catch (error) {
        console.error('Error loading currency:', error);
        dispatch({ 
          type: 'RESTORE_CURRENCY', 
          currency: Currencies.USD,
        });
      }
    };
    
    loadCurrency();
  }, []);
  
  // Currency actions
  const setCurrency = async (currency) => {
    try {
      await AsyncStorage.setItem('currency', JSON.stringify(currency));
      dispatch({ type: 'SET_CURRENCY', currency });
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };
  
  return (
    <CurrencyContext.Provider 
      value={{ 
        currency: state.currency,
        currencies: Currencies,
        setCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook for using currency context
export const useCurrency = () => useContext(CurrencyContext); 