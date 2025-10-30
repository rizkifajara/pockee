import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { StorageService } from '@/services/storage';
import { Transaction, TimePeriod, SavingsTarget } from '@/types';
import {
  getPeriodStats,
  getCategoryStatsForPeriod,
  formatCurrency,
  formatPeriodKey,
  getPeriodKey,
} from '@/utils/helpers';
import { generateId } from '@/utils/helpers';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { colorScheme } = useTheme();
  const theme = Colors[colorScheme];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('monthly');
  const [savingsTargets, setSavingsTargets] = useState<SavingsTarget[]>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const txData = await StorageService.getTransactions();
    const targetData = await StorageService.getSavingsTargets();
    setTransactions(txData);
    setSavingsTargets(targetData);
  };

  const periodStats = getPeriodStats(transactions, selectedPeriod);
  const currentPeriodKey = periodStats[0]?.period || '';
  const currentStats = periodStats[0];
  const categoryStats = currentPeriodKey
    ? getCategoryStatsForPeriod(transactions, selectedPeriod, currentPeriodKey)
    : [];

  const currentTarget = savingsTargets.find(
    (t) => t.period === selectedPeriod && t.periodKey === currentPeriodKey
  );

  const handleSetTarget = async () => {
    if (!targetAmount || !currentPeriodKey) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    try {
      const target: SavingsTarget = {
        id: generateId(),
        period: selectedPeriod,
        periodKey: currentPeriodKey,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentStats?.balance || 0,
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveSavingsTarget(target);
      await loadData();
      setTargetAmount('');
      setShowTargetModal(false);
      Alert.alert('Success', 'Savings target set successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to set savings target');
    }
  };

  // Prepare chart data
  const barData = periodStats.slice(0, 12).reverse().map((stat) => ({
    value: stat.expense,
    label: formatPeriodKey(stat.period, selectedPeriod).split(' ')[0].substring(0, 3),
    frontColor: theme.error,
    spacing: 2,
    labelWidth: 40,
    labelTextStyle: { color: theme.textSecondary, fontSize: 10 },
  }));

  const pieData = categoryStats.map((stat) => ({
    value: stat.amount,
    color: stat.color,
    text: `${stat.percentage.toFixed(0)}%`,
    label: stat.category,
  }));

  const targetProgress = currentTarget
    ? ((currentStats?.balance || 0) / currentTarget.targetAmount) * 100
    : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Track your financial progress
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as TimePeriod[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                { borderColor: theme.border, borderWidth: 1 },
                selectedPeriod === period && { backgroundColor: theme.primary },
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: theme.textPrimary },
                  selectedPeriod === period && { color: '#fff' },
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Period Summary */}
        {currentStats && (
          <View style={[styles.card, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {formatPeriodKey(currentPeriodKey, selectedPeriod)}
              </Text>
              <TouchableOpacity onPress={() => setShowTargetModal(true)}>
                <Ionicons name="flag-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Income</Text>
                <Text style={[styles.statValue, { color: theme.success }]}>
                  {formatCurrency(currentStats.income)}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Expense</Text>
                <Text style={[styles.statValue, { color: theme.error }]}>
                  {formatCurrency(currentStats.expense)}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Balance</Text>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {formatCurrency(currentStats.balance)}
                </Text>
              </View>
            </View>

            {/* Savings Target Progress */}
            {currentTarget && (
              <View style={styles.targetSection}>
                <View style={styles.targetHeader}>
                  <Text style={[styles.targetLabel, { color: theme.textSecondary }]}>
                    Savings Target
                  </Text>
                  <Text style={[styles.targetAmount, { color: theme.primary }]}>
                    {formatCurrency(currentTarget.targetAmount)}
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: `${theme.primary}20` }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.primary,
                        width: `${Math.min(targetProgress, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                  {targetProgress.toFixed(1)}% ({formatCurrency(currentStats.balance)} /{' '}
                  {formatCurrency(currentTarget.targetAmount)})
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Expense Trend Chart */}
        {periodStats.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Expense Trend</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={barData}
                barWidth={22}
                spacing={24}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: theme.textSecondary }}
                noOfSections={3}
                maxValue={Math.max(...barData.map((d) => d.value)) * 1.2}
                height={180}
                width={screenWidth - Spacing.lg * 4}
              />
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.cardSurface, borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Expense by Category
            </Text>
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                donut
                radius={90}
                innerRadius={60}
                innerCircleColor={theme.cardSurface}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={[styles.centerLabelText, { color: theme.textPrimary }]}>
                      {formatCurrency(currentStats?.expense || 0)}
                    </Text>
                  </View>
                )}
              />
            </View>

            <View style={styles.categoryList}>
              {categoryStats.map((stat) => (
                <View key={stat.category} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: stat.color }]} />
                    <Text style={[styles.categoryName, { color: theme.textPrimary }]}>
                      {stat.category.charAt(0).toUpperCase() + stat.category.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.categoryValues}>
                    <Text style={[styles.categoryAmount, { color: theme.textPrimary }]}>
                      {formatCurrency(stat.amount)}
                    </Text>
                    <Text style={[styles.categoryPercentage, { color: theme.textSecondary }]}>
                      {stat.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {transactions.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.cardSurface }]}>
            <Ionicons name="analytics-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No data to analyze yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Add some transactions to see your analytics
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Savings Target Modal */}
      <Modal
        visible={showTargetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTargetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardSurface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Set Savings Target
              </Text>
              <TouchableOpacity onPress={() => setShowTargetModal(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {formatPeriodKey(currentPeriodKey, selectedPeriod)}
            </Text>

            <TextInput
              style={[
                styles.targetInput,
                { backgroundColor: theme.background, color: theme.textPrimary },
              ]}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="Enter target amount"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleSetTarget}
            >
              <Text style={styles.modalButtonText}>Set Target</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  card: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  targetSection: {
    marginTop: Spacing.lg,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  targetLabel: {
    fontSize: FontSizes.sm,
  },
  targetAmount: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  pieContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabelText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  categoryList: {
    gap: Spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  categoryValues: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  categoryPercentage: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  emptyState: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
  },
  targetInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
  },
  modalButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
});
