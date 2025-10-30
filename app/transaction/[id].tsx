import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { StorageService } from '@/services/storage';
import { Transaction, ReceiptItem } from '@/types';
import { formatCurrency, formatDate } from '@/utils/helpers';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useTheme();
  const theme = Colors[colorScheme];
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedItems, setEditedItems] = useState<ReceiptItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    const transactions = await StorageService.getTransactions();
    const found = transactions.find((t) => t.id === id);
    if (found) {
      setTransaction(found);
      setEditedDescription(found.description || '');
      setEditedItems(found.items || []);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteTransaction(id);
              Alert.alert('Success', 'Transaction deleted successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedDescription(transaction?.description || '');
    setEditedItems(transaction?.items || []);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDescription(transaction?.description || '');
    setEditedItems(transaction?.items || []);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity('1');
  };

  const handleSaveEdit = async () => {
    if (!transaction) return;

    try {
      const updatedTotal = editedItems.reduce((sum, item) => sum + item.price, 0);

      await StorageService.updateTransaction(id, {
        description: editedDescription,
        items: editedItems,
        amount: updatedTotal,
      });

      Alert.alert('Success', 'Transaction updated successfully');
      setIsEditing(false);
      await loadTransaction();
    } catch (error) {
      Alert.alert('Error', 'Failed to update transaction');
    }
  };

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice) {
      Alert.alert('Error', 'Please enter item name and price');
      return;
    }

    const newItem: ReceiptItem = {
      name: newItemName,
      price: parseFloat(newItemPrice),
      quantity: parseInt(newItemQuantity) || 1,
    };

    setEditedItems([...editedItems, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = editedItems.filter((_, i) => i !== index);
          setEditedItems(updated);
        },
      },
    ]);
  };

  const handleEditItem = (index: number) => {
    const item = editedItems[index];
    Alert.prompt(
      'Edit Item',
      'Enter new item name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (newName) => {
            if (newName) {
              Alert.prompt(
                'Edit Item',
                'Enter new price',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Save',
                    onPress: (newPrice) => {
                      if (newPrice && !isNaN(parseFloat(newPrice))) {
                        const updated = [...editedItems];
                        updated[index] = {
                          ...updated[index],
                          name: newName,
                          price: parseFloat(newPrice),
                        };
                        setEditedItems(updated);
                      }
                    },
                  },
                ],
                'plain-text',
                item.price.toString()
              );
            }
          },
        },
      ],
      'plain-text',
      item.name
    );
  };

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.textPrimary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasItems = transaction.items && transaction.items.length > 0;
  const hasBreakdown = !!(transaction.subtotal || transaction.tax || transaction.serviceCharge);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isEditing ? 'Edit Transaction' : (
            transaction ? (transaction.description || transaction.merchant || 'Transaction Details') : 'Transaction Details'
          )}
        </Text>
        <View style={styles.headerActions}>
          {!isEditing ? (
            <>
              <TouchableOpacity onPress={handleStartEdit} style={styles.headerButton}>
                <Ionicons name="pencil" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Ionicons name="trash" size={20} color={theme.error} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.headerButton}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} style={styles.headerButton}>
                <Ionicons name="checkmark" size={20} color={theme.success} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.container}>
        {/* Main Info Card */}
        <View style={[styles.card, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}>
          <View
            style={[
              styles.amountBadge,
              {
                backgroundColor:
                  transaction.type === 'credit' ? `${theme.success}20` : `${theme.error}20`,
              },
            ]}
          >
            <Ionicons
              name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'}
              size={32}
              color={transaction.type === 'credit' ? theme.success : theme.error}
            />
          </View>

          <Text
            style={[
              styles.amount,
              {
                color: transaction.type === 'credit' ? theme.success : theme.error,
              },
            ]}
          >
            {transaction.type === 'credit' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>

          {isEditing ? (
            <TextInput
              style={[
                styles.descriptionInput,
                { backgroundColor: theme.background, color: theme.textPrimary },
              ]}
              value={editedDescription}
              onChangeText={setEditedDescription}
              placeholder="Description"
              placeholderTextColor={theme.textSecondary}
            />
          ) : (
            <Text style={[styles.description, { color: theme.textPrimary }]}>
              {transaction.description || transaction.merchant || 'Transaction'}
            </Text>
          )}

          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(transaction.date)}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Type</Text>
              <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
                {transaction.type === 'credit' ? 'Income' : 'Expense'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Source</Text>
              <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
                {transaction.source === 'receipt'
                  ? 'Receipt'
                  : transaction.source === 'mutasi'
                  ? 'Bank Statement'
                  : 'Manual'}
              </Text>
            </View>
            {transaction.category && (
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Category</Text>
                <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
                  {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Items List */}
        {(hasItems || isEditing) && (
          <View style={[styles.card, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Items</Text>
              {isEditing && (
                <Text style={[styles.itemCount, { color: theme.textSecondary }]}>
                  {editedItems.length} item(s)
                </Text>
              )}
            </View>

            {isEditing ? (
              <>
                {editedItems.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.itemRow,
                      index !== editedItems.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: theme.textPrimary }]}>
                        {item.name}
                      </Text>
                      {item.quantity && item.quantity > 1 && (
                        <Text style={[styles.itemQuantity, { color: theme.textSecondary }]}>
                          Qty: {item.quantity}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.itemPrice, { color: theme.textPrimary }]}>
                      {formatCurrency(item.price)}
                    </Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={() => handleEditItem(index)}
                        style={styles.itemActionButton}
                      >
                        <Ionicons name="pencil" size={18} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveItem(index)}
                        style={styles.itemActionButton}
                      >
                        <Ionicons name="trash" size={18} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Add New Item Form */}
                <View style={styles.addItemForm}>
                  <Text style={[styles.addItemLabel, { color: theme.textPrimary }]}>
                    Add New Item
                  </Text>
                  <TextInput
                    style={[
                      styles.addItemInput,
                      { backgroundColor: theme.background, color: theme.textPrimary },
                    ]}
                    value={newItemName}
                    onChangeText={setNewItemName}
                    placeholder="Item name"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <View style={styles.addItemRow}>
                    <TextInput
                      style={[
                        styles.addItemInput,
                        styles.addItemInputSmall,
                        { backgroundColor: theme.background, color: theme.textPrimary },
                      ]}
                      value={newItemPrice}
                      onChangeText={setNewItemPrice}
                      placeholder="Price"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[
                        styles.addItemInput,
                        styles.addItemInputSmall,
                        { backgroundColor: theme.background, color: theme.textPrimary },
                      ]}
                      value={newItemQuantity}
                      onChangeText={setNewItemQuantity}
                      placeholder="Qty"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.addItemButton, { backgroundColor: theme.primary }]}
                    onPress={handleAddItem}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addItemButtonText}>Add Item</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              transaction.items!.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.itemRow,
                    index !== transaction.items!.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.textPrimary }]}>
                      {item.name}
                    </Text>
                    {item.quantity && item.quantity > 1 && (
                      <Text style={[styles.itemQuantity, { color: theme.textSecondary }]}>
                        Qty: {item.quantity}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.itemPrice, { color: theme.textPrimary }]}>
                    {formatCurrency(item.price)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Price Breakdown */}
        {hasBreakdown && (
          <View style={[styles.card, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Price Breakdown
            </Text>
            {transaction.subtotal != null && transaction.subtotal > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
                  Subtotal
                </Text>
                <Text style={[styles.breakdownValue, { color: theme.textPrimary }]}>
                  {formatCurrency(transaction.subtotal)}
                </Text>
              </View>
            )}
            {transaction.tax != null && transaction.tax > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
                  Tax
                </Text>
                <Text style={[styles.breakdownValue, { color: theme.textPrimary }]}>
                  {formatCurrency(transaction.tax)}
                </Text>
              </View>
            )}
            {transaction.serviceCharge != null && transaction.serviceCharge > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
                  Service Charge
                </Text>
                <Text style={[styles.breakdownValue, { color: theme.textPrimary }]}>
                  {formatCurrency(transaction.serviceCharge)}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.breakdownRow,
                styles.totalRow,
                { borderTopWidth: 1, borderTopColor: theme.border },
              ]}
            >
              <Text style={[styles.breakdownLabel, styles.totalLabel, { color: theme.textPrimary }]}>
                Total
              </Text>
              <Text
                style={[styles.breakdownValue, styles.totalValue, { color: theme.textPrimary }]}>
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          </View>
        )}
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
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionInput: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  itemCount: {
    fontSize: FontSizes.sm,
  },
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  itemActionButton: {
    padding: Spacing.xs,
  },
  addItemForm: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  addItemLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  addItemInput: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addItemInputSmall: {
    flex: 1,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  addItemButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  amountBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  amount: {
    fontSize: FontSizes.xxl + 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  metaValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: FontSizes.md,
  },
  breakdownValue: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: FontSizes.lg,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: FontSizes.lg,
  },
});
