import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { StorageService } from '@/services/storage';

export default function SettingsScreen() {
  const { colorScheme, themeMode, setThemeMode } = useTheme();
  const theme = Colors[colorScheme];
  const [notifications, setNotifications] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  // Load API key on component mount
  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const storedKey = await StorageService.getApiKey();
      setApiKey(storedKey || '');
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const validateApiKey = (key: string) => {
    // Gemini API keys are typically 39 characters long and start with 'AIza'
    return key.length >= 30 && key.startsWith('AIza');
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    if (!validateApiKey(apiKey.trim())) {
      Alert.alert(
        'Invalid API Key',
        'Please enter a valid Gemini API key. It should start with "AIza" and be at least 30 characters long.'
      );
      return;
    }

    setApiKeyLoading(true);
    try {
      await StorageService.saveApiKey(apiKey.trim());
      Alert.alert('Success', 'API key saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
      console.error('Error saving API key:', error);
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleRemoveApiKey = () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your API key? You will need to enter it again to use AI features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.removeApiKey();
              setApiKey('');
              Alert.alert('Success', 'API key removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove API key');
              console.error('Error removing API key:', error);
            }
          },
        },
      ]
    );
  };

  const handleToggleDarkMode = (value: boolean) => {
    setThemeMode(value ? 'dark' : 'light');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all transactions? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAllTransactions();
            Alert.alert('Success', 'All transactions have been cleared');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Export functionality coming soon!');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Manage your preferences
          </Text>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>App Settings</Text>

          <View style={[styles.settingCard, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon" size={24} color={theme.textPrimary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                    Dark Mode
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Toggle dark theme
                  </Text>
                </View>
              </View>
              <Switch
                value={colorScheme === 'dark'}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={24} color={theme.textPrimary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                    Notifications
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Enable push notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
          </View>
        </View>

        {/* API Configuration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            API Configuration
          </Text>

          <View style={[styles.settingCard, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="key" size={24} color={theme.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                    Gemini API Key
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Your API key for AI receipt scanning and text processing
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.apiKeyContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.apiKeyInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="Enter your Gemini API key"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showApiKey}
                  multiline={true}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowApiKey(!showApiKey)}
                >
                  <Ionicons
                    name={showApiKey ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.apiKeyActions}>
                <TouchableOpacity
                  style={[
                    styles.apiKeyButton,
                    styles.saveButton,
                    { backgroundColor: theme.primary },
                    apiKeyLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleSaveApiKey}
                  disabled={apiKeyLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {apiKeyLoading ? 'Saving...' : 'Save Key'}
                  </Text>
                </TouchableOpacity>

                {apiKey ? (
                  <TouchableOpacity
                    style={[
                      styles.apiKeyButton,
                      styles.removeButton,
                      { borderColor: theme.error },
                    ]}
                    onPress={handleRemoveApiKey}
                  >
                    <Text style={[styles.removeButtonText, { color: theme.error }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.apiKeyNote}>
                <Ionicons name="information-circle" size={16} color={theme.textSecondary} />
                <Text style={[styles.apiKeyNoteText, { color: theme.textSecondary }]}>
                  Get your free API key from Google AI Studio
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Data Management
          </Text>

          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}
            onPress={handleExportData}
          >
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="download" size={24} color={theme.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                    Export Data
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Download your transactions
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}
            onPress={handleClearData}
          >
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="trash" size={24} color={theme.error} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.error }]}>
                    Clear All Data
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Delete all transactions
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>About</Text>

          <View style={[styles.settingCard, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="information-circle" size={24} color={theme.textPrimary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                    Version
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    1.0.0
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="help-circle" size={24} color={theme.textPrimary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                    Help & Support
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Get help using Pockee
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="shield-checkmark" size={24} color={theme.textPrimary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                    Privacy Policy
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    How we protect your data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Made with ❤️ for better finance tracking
          </Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Powered by Gemini AI
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  settingCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: FontSizes.xs,
  },
  // API Key styles
  apiKeyContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  inputWrapper: {
    position: 'relative',
  },
  apiKeyInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.sm,
    borderWidth: 1,
    paddingRight: 48,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiKeyActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  apiKeyButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 40,
  },
  saveButton: {
    flex: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  removeButton: {
    borderWidth: 1,
    flex: 1,
  },
  removeButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  apiKeyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.sm,
  },
  apiKeyNoteText: {
    fontSize: FontSizes.xs,
    flex: 1,
  },
});
