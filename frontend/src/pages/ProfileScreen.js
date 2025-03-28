import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { useCurrency, Currencies } from '../contexts/CurrencyContext';
import { API_URL } from '../config';

const ProfileScreen = () => {
  const { state, signOut, updateUser } = useContext(AuthContext);
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { currency, currencies, setCurrency } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(state.user?.fullName || '');
  const [email, setEmail] = useState(state.user?.email || '');
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSaveChanges = async () => {
    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/api/users`, {
        fullName,
        email,
      });

      // Update user in context
      updateUser(response.data);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logout button pressed');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('Logout confirmed, calling signOut');
    try {
      await signOut();
      console.log('signOut function completed');
    } catch (error) {
      console.error('Error in logout process:', error);
      Alert.alert('Logout Error', 'There was a problem logging out. Please try again.');
    } finally {
      setShowLogoutModal(false);
    }
  };

  const getThemeModeText = () => {
    switch (themeMode) {
      case ThemeMode.LIGHT:
        return 'Light Mode';
      case ThemeMode.DARK:
        return 'Dark Mode';
      case ThemeMode.SYSTEM:
        return 'System Default';
      default:
        return 'System Default';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.white }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {state.user?.username.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        <Text style={[styles.username, { color: theme.white }]}>
          {state.user?.username || 'User'}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
        {!isEditing ? (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={theme.textLight} />
              <Text style={[styles.infoLabel, { color: theme.textLight }]}>Full Name</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {state.user?.fullName || 'Not set'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={theme.textLight} />
              <Text style={[styles.infoLabel, { color: theme.textLight }]}>Email</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {state.user?.email || 'Not set'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.editProfileButton, { backgroundColor: theme.primary }]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color={theme.white} />
              <Text style={[styles.editProfileText, { color: theme.white }]}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? theme.background : theme.lightGray,
                  color: theme.text,
                  borderColor: theme.border 
                }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? theme.background : theme.lightGray,
                  color: theme.text,
                  borderColor: theme.border 
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton, { 
                  backgroundColor: isDark ? '#2c2c2c' : theme.lightGray,
                  borderColor: theme.border
                }]}
                onPress={() => {
                  setIsEditing(false);
                  setFullName(state.user?.fullName || '');
                  setEmail(state.user?.email || '');
                }}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveChanges}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.white} size="small" />
                ) : (
                  <Text style={[styles.saveButtonText, { color: theme.white }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>

        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: theme.border }]} 
          onPress={() => setThemeMode(ThemeMode.LIGHT)}
        >
          <Ionicons 
            name="sunny-outline" 
            size={24} 
            color={themeMode === ThemeMode.LIGHT ? (isDark ? theme.white : theme.primary) : theme.textLight} 
          />
          <Text style={[styles.optionText, { color: theme.text }]}>Light Mode</Text>
          {themeMode === ThemeMode.LIGHT && (
            <Ionicons name="checkmark" size={24} color={isDark ? theme.white : theme.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: theme.border }]} 
          onPress={() => setThemeMode(ThemeMode.DARK)}
        >
          <Ionicons 
            name="moon-outline" 
            size={24} 
            color={themeMode === ThemeMode.DARK ? (isDark ? theme.white : theme.primary) : theme.textLight} 
          />
          <Text style={[styles.optionText, { color: theme.text }]}>Dark Mode</Text>
          {themeMode === ThemeMode.DARK && (
            <Ionicons name="checkmark" size={24} color={isDark ? theme.white : theme.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option} 
          onPress={() => setThemeMode(ThemeMode.SYSTEM)}
        >
          <Ionicons 
            name="phone-portrait-outline" 
            size={24} 
            color={themeMode === ThemeMode.SYSTEM ? (isDark ? theme.white : theme.primary) : theme.textLight} 
          />
          <Text style={[styles.optionText, { color: theme.text }]}>System Default</Text>
          {themeMode === ThemeMode.SYSTEM && (
            <Ionicons name="checkmark" size={24} color={isDark ? theme.white : theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Currency</Text>
        
        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: theme.border }]} 
          onPress={() => setCurrency(Currencies.USD)}
        >
          <Ionicons 
            name="cash-outline" 
            size={24} 
            color={currency.code === Currencies.USD.code ? (isDark ? theme.white : theme.primary) : theme.textLight} 
          />
          <Text style={[styles.optionText, { color: theme.text }]}>US Dollar ($)</Text>
          {currency.code === Currencies.USD.code && (
            <Ionicons name="checkmark" size={24} color={isDark ? theme.white : theme.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: theme.border }]} 
          onPress={() => setCurrency(Currencies.EUR)}
        >
          <Ionicons 
            name="cash-outline" 
            size={24} 
            color={currency.code === Currencies.EUR.code ? (isDark ? theme.white : theme.primary) : theme.textLight} 
          />
          <Text style={[styles.optionText, { color: theme.text }]}>Euro (€)</Text>
          {currency.code === Currencies.EUR.code && (
            <Ionicons name="checkmark" size={24} color={isDark ? theme.white : theme.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: theme.border }]} 
          onPress={() => setCurrency(Currencies.GBP)}
        >
          <Ionicons 
            name="cash-outline" 
            size={24} 
            color={currency.code === Currencies.GBP.code ? (isDark ? theme.white : theme.primary) : theme.textLight} 
          />
          <Text style={[styles.optionText, { color: theme.text }]}>British Pound (£)</Text>
          {currency.code === Currencies.GBP.code && (
            <Ionicons name="checkmark" size={24} color={isDark ? theme.white : theme.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: theme.border }]} 
          onPress={() => setCurrency(Currencies.JPY)}
        >
          <Ionicons 
            name="cash-outline" 
            size={24} 
            color={currency.code === Currencies.JPY.code ? (isDark ? theme.white : theme.primary) : theme.textLight} 
          />
          <Text style={[styles.optionText, { color: theme.text }]}>Japanese Yen (¥)</Text>
          {currency.code === Currencies.JPY.code && (
            <Ionicons name="checkmark" size={24} color={isDark ? theme.white : theme.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option} 
          onPress={() => setCurrency(Currencies.INR)}
        >
          <Ionicons 
            name="cash-outline" 
            size={24} 
            color={currency.code === Currencies.INR.code ? (isDark ? theme.white : theme.primary) : theme.textLight} 
          />
          <Text style={[styles.optionText, { color: theme.text }]}>Indian Rupee (₹)</Text>
          {currency.code === Currencies.INR.code && (
            <Ionicons name="checkmark" size={24} color={isDark ? theme.white : theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>

        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.appInfo}>
        <Text style={[styles.appVersion, { color: theme.textLight }]}>SplitSmart v1.0.0</Text>
      </View>

      {/* Logout confirmation modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Confirm Logout</Text>
            <Text style={[styles.modalMessage, { color: theme.textLight }]}>
              Are you sure you want to log out?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton, { 
                  backgroundColor: isDark ? '#2c2c2c' : theme.lightGray 
                }]} 
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.cancelModalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmModalButton, { backgroundColor: theme.error }]} 
                onPress={confirmLogout}
              >
                <Text style={styles.confirmModalButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    marginLeft: 10,
    width: 80,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: 24,
  },
  appVersion: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButton: {
    marginRight: 8,
  },
  confirmModalButton: {
    marginLeft: 8,
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 