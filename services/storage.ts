import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, SavingsTarget } from '../types';

const TRANSACTIONS_KEY = '@pockee_transactions';
const SETTINGS_KEY = '@pockee_settings';
const SAVINGS_TARGETS_KEY = '@pockee_savings_targets';
const API_KEY_KEY = '@pockee_gemini_api_key';

export const StorageService = {
  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  },

  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      transactions.unshift(transaction);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex((t) => t.id === id);
      if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updates };
        await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const filtered = transactions.filter((t) => t.id !== id);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  async clearAllTransactions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TRANSACTIONS_KEY);
    } catch (error) {
      console.error('Error clearing transactions:', error);
      throw error;
    }
  },

  // Settings
  async getSettings(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { theme: 'light' };
    } catch (error) {
      console.error('Error loading settings:', error);
      return { theme: 'light' };
    }
  },

  async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  // Savings Targets
  async getSavingsTargets(): Promise<SavingsTarget[]> {
    try {
      const data = await AsyncStorage.getItem(SAVINGS_TARGETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading savings targets:', error);
      return [];
    }
  },

  async saveSavingsTarget(target: SavingsTarget): Promise<void> {
    try {
      const targets = await this.getSavingsTargets();
      // Replace existing target for same period or add new one
      const index = targets.findIndex(
        (t) => t.period === target.period && t.periodKey === target.periodKey
      );
      if (index !== -1) {
        targets[index] = target;
      } else {
        targets.unshift(target);
      }
      await AsyncStorage.setItem(SAVINGS_TARGETS_KEY, JSON.stringify(targets));
    } catch (error) {
      console.error('Error saving savings target:', error);
      throw error;
    }
  },

  async updateSavingsTarget(id: string, updates: Partial<SavingsTarget>): Promise<void> {
    try {
      const targets = await this.getSavingsTargets();
      const index = targets.findIndex((t) => t.id === id);
      if (index !== -1) {
        targets[index] = { ...targets[index], ...updates };
        await AsyncStorage.setItem(SAVINGS_TARGETS_KEY, JSON.stringify(targets));
      }
    } catch (error) {
      console.error('Error updating savings target:', error);
      throw error;
    }
  },

  async deleteSavingsTarget(id: string): Promise<void> {
    try {
      const targets = await this.getSavingsTargets();
      const filtered = targets.filter((t) => t.id !== id);
      await AsyncStorage.setItem(SAVINGS_TARGETS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting savings target:', error);
      throw error;
    }
  },

  async getSavingsTargetForPeriod(
    period: string,
    periodKey: string
  ): Promise<SavingsTarget | null> {
    try {
      const targets = await this.getSavingsTargets();
      return targets.find((t) => t.period === period && t.periodKey === periodKey) || null;
    } catch (error) {
      console.error('Error getting savings target:', error);
      return null;
    }
  },

  // API Key Management
  async getApiKey(): Promise<string | null> {
    try {
      const data = await AsyncStorage.getItem(API_KEY_KEY);
      return data;
    } catch (error) {
      console.error('Error loading API key:', error);
      return null;
    }
  },

  async saveApiKey(apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem(API_KEY_KEY, apiKey);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  },

  async removeApiKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(API_KEY_KEY);
    } catch (error) {
      console.error('Error removing API key:', error);
      throw error;
    }
  },
};
