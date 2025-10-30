import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';

interface PasswordInputModalProps {
  visible: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

export default function PasswordInputModal({
  visible,
  onSubmit,
  onCancel,
  loading = false,
  error,
}: PasswordInputModalProps) {
  const { colorScheme } = useTheme();
  const theme = Colors[colorScheme];
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (password.trim()) {
      onSubmit(password);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setShowPassword(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.cardSurface }]}>
          <View style={styles.header}>
            <Ionicons name="lock-closed" size={32} color={theme.primary} />
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Password Protected PDF
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              This PDF is password-protected. Enter the password to continue.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.textPrimary,
                    borderColor: error ? theme.error : theme.border,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter PDF password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showPassword}
                autoFocus
                editable={!loading}
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={16} color={theme.success} />
              <Text style={[styles.securityText, { color: theme.textSecondary }]}>
                Password is only used locally and never sent to any server
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: theme.border },
              ]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                { backgroundColor: theme.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Unlock PDF</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
    borderWidth: 1,
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  errorText: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    gap: 8,
  },
  securityText: {
    fontSize: FontSizes.xs,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
