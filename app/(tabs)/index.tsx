import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { StorageService } from '@/services/storage';
import { Transaction } from '@/types';
import { formatCurrency, formatDate, calculateBalance } from '@/utils/helpers';

export default function HomeScreen() {
  const { colorScheme } = useTheme();
  const theme = Colors[colorScheme];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const [transactionsAnimated, setTransactionsAnimated] = useState(false);

  const loadTransactions = async () => {
    const data = await StorageService.getTransactions();
    setTransactions(data);
  };

  useEffect(() => {
    loadTransactions();

    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Animate transactions when they load
    if (transactions.length > 0 && !transactionsAnimated) {
      setTransactionsAnimated(true);
    }
  }, [transactions, transactionsAnimated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const balance = calculateBalance(transactions);
  const recentTransactions = transactions.slice(0, 10);

  // Get the date of the most recent bank statement transaction for the balance label
  const transactionsWithBalance = transactions
    .filter((t) => t.balance !== undefined && t.balance !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const balanceDate = transactionsWithBalance.length > 0
    ? formatDate(transactionsWithBalance[0].date)
    : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.textPrimary }]}>Hello!</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Welcome to Pockee
          </Text>
        </View>

        {/* Balance Card */}
        <Animated.View
          style={[
            styles.balanceCardAnimated,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={colorScheme === 'dark' ? ['#E67A35', '#FF9955'] : ['#FF8C42', '#FFB366']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
          <Text style={styles.balanceLabel}>
            {balanceDate ? `Bank Balance (as of ${balanceDate})` : 'Total Balance'}
          </Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <View style={styles.balanceStats}>
            <View style={styles.statItem}>
              <Ionicons name="arrow-down-circle" size={20} color="#fff" />
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statValue}>
                {formatCurrency(
                  transactions
                    .filter((t) => t.type === 'credit')
                    .reduce((acc, t) => acc + t.amount, 0)
                )}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="arrow-up-circle" size={20} color="#fff" />
              <Text style={styles.statLabel}>Expense</Text>
              <Text style={styles.statValue}>
                {formatCurrency(
                  transactions
                    .filter((t) => t.type === 'debit')
                    .reduce((acc, t) => acc + t.amount, 0)
                )}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Recent Transactions
            </Text>
            {transactions.length > 10 && (
              <TouchableOpacity>
                <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.cardSurface }]}>
              <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Tap the Add button to get started
              </Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {recentTransactions.map((transaction, index) => {
                const animValue = new Animated.Value(0);

                // Staggered animation for each transaction
                if (transactionsAnimated) {
                  Animated.timing(animValue, {
                    toValue: 1,
                    duration: 400,
                    delay: index * 100, // Stagger by 100ms
                    useNativeDriver: true,
                  }).start();
                }

                return (
                  <Animated.View
                    key={transaction.id}
                    style={[
                      {
                        opacity: animValue,
                        transform: [{ translateX: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }) }],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.transactionItem,
                        { backgroundColor: theme.cardSurface, borderColor: theme.border },
                      ]}
                      onPress={() => router.push(`/transaction/${transaction.id}`)}
                    >
                  <View
                    style={[
                      styles.transactionIcon,
                      {
                        backgroundColor:
                          transaction.type === 'credit'
                            ? `${theme.success}20`
                            : `${theme.error}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                      size={20}
                      color={transaction.type === 'credit' ? theme.success : theme.error}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionDescription, { color: theme.textPrimary }]}>
                      {transaction.description || transaction.merchant || 'Transaction'}
                    </Text>
                    <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color: transaction.type === 'credit' ? theme.success : theme.error,
                      },
                    ]}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
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
  balanceCardAnimated: {
    margin: Spacing.lg,
  },
  greeting: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  balanceCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: FontSizes.sm,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: FontSizes.xxl + 8,
    fontWeight: 'bold',
    marginTop: Spacing.sm,
  },
  balanceStats: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: '#fff',
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    opacity: 0.9,
  },
  statValue: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: FontSizes.sm,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  transactionList: {
    gap: Spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  transactionDescription: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
});
