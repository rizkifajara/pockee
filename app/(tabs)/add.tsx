import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { StorageService } from '@/services/storage';
import { GeminiService } from '@/services/gemini';
import { Transaction, TransactionType, TransactionCategory } from '@/types';
import { generateId } from '@/utils/helpers';
import PasswordInputModal from '@/components/PasswordInputModal';
import { checkPDFProtection, extractPDFText } from '@/utils/pdfUtils';
import { router } from 'expo-router';

export default function AddTransactionScreen() {
  const { colorScheme } = useTheme();
  const theme = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'select' | 'receipt' | 'file' | 'manual'>('select');

  // Manual entry state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('debit');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [suggestingCategory, setSuggestingCategory] = useState(false);

  // PDF password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingPdfUri, setPendingPdfUri] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();

  // Helper function to check API key before AI features
  const checkApiKeyAndProceed = async (featureName: string): Promise<boolean> => {
    try {
      const apiKey = await StorageService.getApiKey();
      if (!apiKey) {
        Alert.alert(
          'API Key Required',
          `To use ${featureName}, you need to set up your Gemini API key first.\n\nGo to Settings → API Configuration to add your key.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: () => router.push('/(tabs)/settings'),
            },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  };

  const handleScanReceipt = async () => {
    try {
      // Check API key first
      const hasApiKey = await checkApiKeyAndProceed('Receipt Scanning');
      if (!hasApiKey) return;

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan receipts');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        const receiptData = await GeminiService.parseReceipt(result.assets[0].base64);

        // Suggest category based on merchant
        const suggestedCategory = await GeminiService.suggestCategory(
          receiptData.merchant,
          receiptData.merchant
        );

        const transaction: Transaction = {
          id: generateId(),
          date: receiptData.date,
          description: receiptData.merchant,
          merchant: receiptData.merchant,
          type: 'debit',
          amount: receiptData.total,
          items: receiptData.items,
          subtotal: receiptData.subtotal,
          tax: receiptData.tax,
          serviceCharge: receiptData.serviceCharge,
          source: 'receipt',
          category: suggestedCategory as TransactionCategory,
          createdAt: new Date().toISOString(),
        };

        await StorageService.saveTransaction(transaction);
        Alert.alert('Success', 'Receipt scanned and saved successfully!');
        setMode('select');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Check API key first
      const hasApiKey = await checkApiKeyAndProceed('Image Processing');
      if (!hasApiKey) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        const receiptData = await GeminiService.parseReceipt(result.assets[0].base64);

        // Suggest category based on merchant
        const suggestedCategory = await GeminiService.suggestCategory(
          receiptData.merchant,
          receiptData.merchant
        );

        const transaction: Transaction = {
          id: generateId(),
          date: receiptData.date,
          description: receiptData.merchant,
          merchant: receiptData.merchant,
          type: 'debit',
          amount: receiptData.total,
          items: receiptData.items,
          subtotal: receiptData.subtotal,
          tax: receiptData.tax,
          serviceCharge: receiptData.serviceCharge,
          source: 'receipt',
          category: suggestedCategory as TransactionCategory,
          createdAt: new Date().toISOString(),
        };

        await StorageService.saveTransaction(transaction);
        Alert.alert('Success', 'Receipt processed and saved successfully!');
        setMode('select');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async () => {
    try {
      // Check API key first
      const hasApiKey = await checkApiKeyAndProceed('Bank Statement Processing');
      if (!hasApiKey) return;

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];

        // Check if it's a PDF
        if (file.mimeType === 'application/pdf') {
          // Check if PDF is password-protected
          const isProtected = await checkPDFProtection(file.uri);

          if (isProtected) {
            // Show password modal to decrypt
            setPendingPdfUri(file.uri);
            setPasswordError(undefined);
            setShowPasswordModal(true);
          } else {
            // Process PDF directly
            await processPDF(file.uri);
          }
        } else {
          Alert.alert('Info', 'CSV and Excel parsing coming soon! Please use PDF files for now.');
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingPdfUri) return;

    try {
      setPasswordLoading(true);
      setPasswordError(undefined);

      // Process PDF with password
      await processPDF(pendingPdfUri, password);

      // Success - close modal
      setShowPasswordModal(false);
      setPendingPdfUri(null);
    } catch (error) {
      console.error('Error processing password-protected PDF:', error);
      setPasswordError('Incorrect password or failed to decrypt PDF. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingPdfUri(null);
    setPasswordError(undefined);
  };

  const processPDF = async (uri: string, password?: string) => {
    try {
      setLoading(true);

      // Extract PDF content as base64
      const pdfBase64 = await extractPDFText(uri, password);

      // Parse bank mutasi using Gemini
      const transactions = await GeminiService.parseBankMutasiPDF(pdfBase64);

      if (!transactions || transactions.length === 0) {
        Alert.alert('Info', 'No transactions found in the PDF. Please check the file.');
        return;
      }

      // Sort transactions by date to find the most recent
      const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Most recent first
      });

      // Get the current balance from the most recent transaction
      const currentBalance = sortedTransactions[0]?.balance || 0;

      // Suggest categories for each transaction and save
      let savedCount = 0;
      for (const mutasiData of transactions) {
        const suggestedCategory = await GeminiService.suggestCategory(mutasiData.description);

        const transaction: Transaction = {
          id: generateId(),
          date: mutasiData.date,
          description: mutasiData.description,
          type: mutasiData.type,
          amount: mutasiData.amount,
          balance: mutasiData.balance,
          source: 'mutasi',
          category: suggestedCategory as TransactionCategory,
          createdAt: new Date().toISOString(),
        };

        await StorageService.saveTransaction(transaction);
        savedCount++;
      }

      Alert.alert(
        'Success',
        `Successfully imported ${savedCount} transaction${savedCount !== 1 ? 's' : ''} from your bank statement!\n\nCurrent Balance: Rp ${currentBalance.toLocaleString('id-ID')}`
      );
      setMode('select');
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestCategory = async () => {
    if (!description) {
      Alert.alert('Info', 'Please enter a description first');
      return;
    }

    try {
      // Check API key first
      const hasApiKey = await checkApiKeyAndProceed('AI Category Suggestion');
      if (!hasApiKey) return;
      setSuggestingCategory(true);
      const suggestedCategory = await GeminiService.suggestCategory(description);
      setCategory(suggestedCategory as TransactionCategory);
    } catch (error) {
      Alert.alert('Error', 'Failed to suggest category');
    } finally {
      setSuggestingCategory(false);
    }
  };

  const handleManualSave = async () => {
    if (!description || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const transaction: Transaction = {
        id: generateId(),
        date: new Date().toISOString(),
        description,
        type,
        amount: parseFloat(amount),
        source: 'manual',
        category,
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveTransaction(transaction);
      Alert.alert('Success', 'Transaction saved successfully!');
      setDescription('');
      setAmount('');
      setCategory('other');
      setMode('select');
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
            Processing with AI...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'manual') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMode('select')}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Manual Entry</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Description *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.cardSurface, color: theme.textPrimary },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Amount *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.cardSurface, color: theme.textPrimary },
              ]}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Type</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'debit' && { backgroundColor: theme.error },
                  { borderColor: theme.border },
                ]}
                onPress={() => setType('debit')}
              >
                <Text style={[styles.typeButtonText, type === 'debit' && { color: '#fff' }]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'credit' && { backgroundColor: theme.success },
                  { borderColor: theme.border },
                ]}
                onPress={() => setType('credit')}
              >
                <Text style={[styles.typeButtonText, type === 'credit' && { color: '#fff' }]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>Category</Text>
              <TouchableOpacity
                onPress={handleSuggestCategory}
                disabled={suggestingCategory}
                style={styles.suggestButton}
              >
                {suggestingCategory ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color={theme.primary} />
                    <Text style={[styles.suggestText, { color: theme.primary }]}>AI Suggest</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.categoryGrid}>
              {(['food', 'shopping', 'transport', 'bills', 'entertainment', 'salary', 'other'] as TransactionCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    { borderColor: theme.border },
                    category === cat && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      { color: theme.textPrimary },
                      category === cat && { color: '#fff' },
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleManualSave}
          >
            <Text style={styles.saveButtonText}>Save Transaction</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Add Transaction</Text>
      </View>

      <ScrollView style={styles.container}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose how to add your transaction
        </Text>

        <View style={styles.optionsGrid}>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}
              onPress={handleScanReceipt}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="camera" size={28} color={theme.primary} />
              </View>
              <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Scan Receipt</Text>
              <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                Take photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}
              onPress={handlePickImage}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${theme.secondary}20` }]}>
                <Ionicons name="image" size={28} color={theme.secondary} />
              </View>
              <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Upload Image</Text>
              <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                From gallery
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}
              onPress={handleUploadFile}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${theme.success}20` }]}>
                <Ionicons name="document-text" size={28} color={theme.success} />
              </View>
              <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Upload File</Text>
              <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                Bank mutasi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => setMode('manual')}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${theme.error}20` }]}>
                <Ionicons name="create" size={28} color={theme.error} />
              </View>
              <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Manual Entry</Text>
              <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                Type details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <PasswordInputModal
        visible={showPasswordModal}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
        loading={passwordLoading}
        error={passwordError}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
  },
  optionsGrid: {
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  optionCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  optionTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
  },
  formContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
});
