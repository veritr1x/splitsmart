import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS } from '../../config';
import { isWeb } from '../../utils/platform';
import { getWebStyles } from '../../styles/webStyles';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, state, clearError } = useContext(AuthContext);
  const { theme, isDark } = useTheme();
  const webStyles = getWebStyles(theme);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(50)).current;
  
  // Background animation values
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;

  // Watch for authentication errors
  useEffect(() => {
    if (state.error) {
      Alert.alert('Authentication Error', state.error);
      clearError();
    }
  }, [state.error]);
  
  // Run animations when component mounts
  useEffect(() => {
    // Fade in and move up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(moveAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Only run bubble animations on mobile (they don't look good on web)
    if (!isWeb) {
      // Continuous floating animations for background bubbles
      Animated.loop(
        Animated.sequence([
          Animated.timing(bubble1, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble1, {
            toValue: 0,
            duration: 15000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(bubble2, {
            toValue: 1,
            duration: 18000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble2, {
            toValue: 0,
            duration: 18000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(bubble3, {
            toValue: 1,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble3, {
            toValue: 0,
            duration: 20000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  // Web-specific login screen
  if (isWeb) {
    return (
      <View style={[styles.webContainer, { backgroundColor: theme.background }]}>
        <View style={styles.webContent}>
          <View style={styles.webLeft}>
            <Animated.View 
              style={[
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: moveAnim }]
                }
              ]}
            >
              <Text style={[styles.webTitle, { color: theme.primary }]}>SplitSmart</Text>
              <Text style={[styles.webSubtitle, { color: theme.textLight }]}>
                The easiest way to split expenses with friends and family
              </Text>
              <View style={styles.webFeatures}>
                <View style={styles.webFeatureItem}>
                  <View style={[styles.webFeatureIcon, { backgroundColor: theme.primary }]}>
                    <Text style={styles.webFeatureIconText}>💰</Text>
                  </View>
                  <View style={styles.webFeatureContent}>
                    <Text style={[styles.webFeatureTitle, { color: theme.text }]}>Track Expenses</Text>
                    <Text style={[styles.webFeatureDesc, { color: theme.textLight }]}>
                      Easily keep track of shared expenses and balances
                    </Text>
                  </View>
                </View>
                
                <View style={styles.webFeatureItem}>
                  <View style={[styles.webFeatureIcon, { backgroundColor: theme.primary }]}>
                    <Text style={styles.webFeatureIconText}>👥</Text>
                  </View>
                  <View style={styles.webFeatureContent}>
                    <Text style={[styles.webFeatureTitle, { color: theme.text }]}>Group Management</Text>
                    <Text style={[styles.webFeatureDesc, { color: theme.textLight }]}>
                      Create groups for trips, roommates, and more
                    </Text>
                  </View>
                </View>
                
                <View style={styles.webFeatureItem}>
                  <View style={[styles.webFeatureIcon, { backgroundColor: theme.primary }]}>
                    <Text style={styles.webFeatureIconText}>🔄</Text>
                  </View>
                  <View style={styles.webFeatureContent}>
                    <Text style={[styles.webFeatureTitle, { color: theme.text }]}>Settle Debts</Text>
                    <Text style={[styles.webFeatureDesc, { color: theme.textLight }]}>
                      See who owes what and settle up with one click
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
          
          <View style={styles.webRight}>
            <Animated.View 
              style={[
                styles.webFormContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: moveAnim }],
                  backgroundColor: theme.cardBackground,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }
              ]}
            >
              <Text style={[styles.webFormTitle, { color: theme.text }]}>Log In</Text>
              
              <TextInput
                style={[webStyles.webInput, { 
                  color: theme.text 
                }]}
                placeholder="Email"
                placeholderTextColor={theme.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                style={[webStyles.webInput, { 
                  color: theme.text 
                }]}
                placeholder="Password"
                placeholderTextColor={theme.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.webLoginButton, { backgroundColor: theme.primary }]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: theme.white }]}>Log In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.webRegisterText, { color: theme.primary }]}>
                  Don't have an account? Register here
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    );
  }

  // Mobile login screen (unchanged)
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Animated background bubbles */}
      <Animated.View 
        style={[
          styles.bubble,
          styles.bubble1,
          {
            backgroundColor: theme.primary,
            opacity: 0.1,
            transform: [
              {
                translateY: bubble1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height * 0.2, -height * 0.2]
                })
              },
              {
                translateX: bubble1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width * 0.1, width * 0.1]
                })
              }
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.bubble,
          styles.bubble2,
          {
            backgroundColor: theme.secondary,
            opacity: 0.1,
            transform: [
              {
                translateY: bubble2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height * 0.1, -height * 0.1]
                })
              },
              {
                translateX: bubble2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [width * 0.2, -width * 0.2]
                })
              }
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.bubble,
          styles.bubble3,
          {
            backgroundColor: theme.accent,
            opacity: 0.1,
            transform: [
              {
                translateY: bubble3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height * 0.3, -height * 0.3]
                })
              },
              {
                translateX: bubble3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width * 0.2, width * 0.2]
                })
              }
            ]
          }
        ]} 
      />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View 
          style={[
            styles.inner, 
            {
              opacity: fadeAnim,
              transform: [{ translateY: moveAnim }]
            }
          ]}
        >
          <Text style={[styles.title, { color: theme.primary }]}>SplitSmart</Text>
          <Text style={[styles.subtitle, { color: theme.textLight }]}>Easily split expenses with friends</Text>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.cardBackground, 
                borderColor: theme.border,
                color: theme.text 
              }]}
              placeholder="Email"
              placeholderTextColor={theme.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.cardBackground, 
                borderColor: theme.border,
                color: theme.text 
              }]}
              placeholder="Password"
              placeholderTextColor={theme.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { color: theme.white }]}>Log In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerText, { color: theme.primary }]}>
                Don't have an account? Register here
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Mobile styles
  container: {
    flex: 1,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 200,
  },
  bubble1: {
    width: width * 0.8,
    height: width * 0.8,
    left: -width * 0.2,
    top: -width * 0.2,
  },
  bubble2: {
    width: width * 0.6,
    height: width * 0.6,
    right: -width * 0.1,
    top: height * 0.3,
  },
  bubble3: {
    width: width * 0.4,
    height: width * 0.4,
    left: width * 0.3,
    bottom: -width * 0.1,
  },
  inner: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    marginBottom: 15,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    marginTop: 20,
    textAlign: 'center',
  },
  
  // Web styles
  webContainer: {
    flex: 1,
    minHeight: '100vh',
  },
  webContent: {
    flexDirection: 'row',
    maxWidth: 1200,
    margin: '0 auto',
    padding: 20,
    flex: 1,
    alignItems: 'center',
  },
  webLeft: {
    flex: 1,
    padding: 40,
  },
  webRight: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  webSubtitle: {
    fontSize: 20,
    marginBottom: 40,
    lineHeight: 28,
  },
  webFeatures: {
    marginTop: 40,
  },
  webFeatureItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  webFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  webFeatureIconText: {
    fontSize: 20,
  },
  webFeatureContent: {
    flex: 1,
  },
  webFeatureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  webFeatureDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  webFormContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 40,
    borderRadius: 8,
  },
  webFormTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  webLoginButton: {
    height: 50,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  webRegisterText: {
    marginTop: 24,
    textAlign: 'center',
  },
});

export default LoginScreen; 