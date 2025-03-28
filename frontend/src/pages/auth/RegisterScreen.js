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
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { isWeb } from '../../utils/platform';
import { getWebStyles } from '../../styles/webStyles';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, state, clearError } = useContext(AuthContext);
  const { theme } = useTheme();
  const webStyles = getWebStyles(theme);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(50)).current;

  // Watch for authentication errors
  useEffect(() => {
    if (state.error) {
      Alert.alert('Registration Error', state.error);
      clearError();
    }
  }, [state.error]);
  
  // Run animations when component mounts
  useEffect(() => {
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
  }, []);

  const validateInputs = () => {
    if (!name || !email || !username || !password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return false;
    }
    
    // Password strength check
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password should be at least 8 characters long.');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;
    
    setIsLoading(true);
    try {
      await register(name, email, username, password);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Web-specific register screen
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
              <Text style={[styles.webTitle, { color: theme.primary }]}>Join SplitSmart</Text>
              <Text style={[styles.webSubtitle, { color: theme.textLight }]}>
                Create your account and start splitting expenses with friends easily
              </Text>
              
              <View style={styles.webSteps}>
                <View style={styles.webStepItem}>
                  <View style={[styles.webStepNumber, { backgroundColor: theme.primary }]}>
                    <Text style={styles.webStepNumberText}>1</Text>
                  </View>
                  <View style={styles.webStepContent}>
                    <Text style={[styles.webStepTitle, { color: theme.text }]}>Create Account</Text>
                    <Text style={[styles.webStepDesc, { color: theme.textLight }]}>
                      Sign up with your email and set up your profile
                    </Text>
                  </View>
                </View>
                
                <View style={styles.webStepItem}>
                  <View style={[styles.webStepNumber, { backgroundColor: theme.primary }]}>
                    <Text style={styles.webStepNumberText}>2</Text>
                  </View>
                  <View style={styles.webStepContent}>
                    <Text style={[styles.webStepTitle, { color: theme.text }]}>Add Friends</Text>
                    <Text style={[styles.webStepDesc, { color: theme.textLight }]}>
                      Connect with friends to split expenses together
                    </Text>
                  </View>
                </View>
                
                <View style={styles.webStepItem}>
                  <View style={[styles.webStepNumber, { backgroundColor: theme.primary }]}>
                    <Text style={styles.webStepNumberText}>3</Text>
                  </View>
                  <View style={styles.webStepContent}>
                    <Text style={[styles.webStepTitle, { color: theme.text }]}>Track Expenses</Text>
                    <Text style={[styles.webStepDesc, { color: theme.textLight }]}>
                      Start recording shared expenses and settle debts
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
              <Text style={[styles.webFormTitle, { color: theme.text }]}>Create Account</Text>
              
              <TextInput
                style={[webStyles.webInput, { color: theme.text }]}
                placeholder="Full Name"
                placeholderTextColor={theme.textLight}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={[webStyles.webInput, { color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                style={[webStyles.webInput, { color: theme.text }]}
                placeholder="Username"
                placeholderTextColor={theme.textLight}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <TextInput
                style={[webStyles.webInput, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TextInput
                style={[webStyles.webInput, { color: theme.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.webRegisterButton, { backgroundColor: theme.primary }]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: theme.white }]}>Register</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.webLoginText, { color: theme.primary }]}>
                  Already have an account? Log in
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    );
  }

  // Mobile register screen
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.inner,
              {
                opacity: fadeAnim,
                transform: [{ translateY: moveAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.textLight }]}>
              Join SplitSmart and start splitting expenses
            </Text>

            <View style={styles.form}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.cardBackground, 
                  borderColor: theme.border,
                  color: theme.text 
                }]}
                placeholder="Full Name"
                placeholderTextColor={theme.textLight}
                value={name}
                onChangeText={setName}
              />

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
                placeholder="Username"
                placeholderTextColor={theme.textLight}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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

              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.cardBackground, 
                  borderColor: theme.border,
                  color: theme.text 
                }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: theme.white }]}>Register</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginText, { color: theme.primary }]}>
                  Already have an account? Log in
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Mobile styles
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  loginText: {
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
  webSteps: {
    marginTop: 40,
  },
  webStepItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  webStepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  webStepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  webStepContent: {
    flex: 1,
  },
  webStepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  webStepDesc: {
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
  webRegisterButton: {
    height: 50,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  webLoginText: {
    marginTop: 24,
    textAlign: 'center',
  },
});

export default RegisterScreen;