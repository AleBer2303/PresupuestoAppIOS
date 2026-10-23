import { create } from 'zustand';
import { and, desc, eq, like } from 'drizzle-orm';
import { db, importExcelSeedData, initializeDatabase } from '../db/client.ts';
import { EXCEL_DEFAULT_MONTH } from '../db/excelSeedData.ts';
import {
  budgets,
  categories,
  transactions,
  type Category,
  type Transaction,
  type TransactionType,
} from '../db/schema.ts';
import {
  CURRENCIES,
  shiftMonth,
  type CurrencyOption,
} from '../utils/formatters.ts';

export interface TransactionWithCategory extends Transaction {
  category: Category;
}

export type BudgetAlertLevel = 'normal' | 'warning' | 'danger';

export interface CategoryBudgetStatus {
  category: Category;
  budgetId: number | null;
  limitAmount: number; // En centavos
  spentAmount: number; // En centavos
  remainingAmount: number; // En centavos
  percentage: number; // 0 a 100+
  alertLevel: BudgetAlertLevel;
}

export interface BalanceSummary {
  totalIncome: number; // En centavos
  totalExpense: number; // En centavos
  netBalance: number; // En centavos
  totalBudgetLimit: number; // En centavos
  budgetUsedPercentage: number; // 0 a 100+
}

export interface CreateTransactionInput {
  amount: number; // En centavos
  type: TransactionType;
  categoryId: number;
  date: string; // ISO string
  note?: string;
}

interface FinanceState {
  isReady: boolean;
  isLoading: boolean;
  selectedMonth: string; // Formato YYYY-MM
  currency: CurrencyOption;
  categories: Category[];
  transactions: TransactionWithCategory[];
  budgetStatuses: CategoryBudgetStatus[];
  balanceSummary: BalanceSummary;
  isTransactionModalOpen: boolean;
  presetTransactionType: TransactionType;

  // Acciones de estado y navegación de mes
  initializeApp: () => Promise<void>;
  refreshData: () => Promise<void>;
  setSelectedMonth: (month: string) => Promise<void>;
  goToPreviousMonth: () => Promise<void>;
  goToNextMonth: () => Promise<void>;
  setCurrency: (currency: CurrencyOption) => void;
  openTransactionModal: (defaultType?: TransactionType) => void;
  closeTransactionModal: () => void;

  // Acciones CRUD SQLite + Drizzle
  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  upsertBudgetLimit: (categoryId: number, limitAmountInCents: number) => Promise<void>;
  restoreExcelData: () => Promise<void>;
}

const INITIAL_SUMMARY: BalanceSummary = {
  totalIncome: 0,
  totalExpense: 0,
  netBalance: 0,
  totalBudgetLimit: 0,
  budgetUsedPercentage: 0,
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isReady: false,
  isLoading: false,
  selectedMonth: EXCEL_DEFAULT_MONTH,
  currency: CURRENCIES[0], // COP ($) por defecto acorde al archivo Excel
  categories: [],
  transactions: [],
  budgetStatuses: [],
  balanceSummary: INITIAL_SUMMARY,
  isTransactionModalOpen: false,
  presetTransactionType: 'expense',

  initializeApp: async () => {
    set({ isLoading: true });
    try {
      await initializeDatabase();
      await get().refreshData();
      set({ isReady: true, isLoading: false });
    } catch (error) {
      console.error('Error al inicializar la base de datos SQLite:', error);
      set({ isLoading: false });
    }
  },

  refreshData: async () => {
    const { selectedMonth } = get();
    set({ isLoading: true });

    try {
      const [allCategories, monthTransactions, monthBudgets] = await Promise.all([
        db.select().from(categories),
        db
          .select()
          .from(transactions)
          .where(like(transactions.date, `${selectedMonth}%`))
          .orderBy(desc(transactions.date), desc(transactions.id)),
        db.select().from(budgets).where(eq(budgets.month, selectedMonth)),
      ]);

      const categoryMap = new Map<number, Category>();
      for (const cat of allCategories) {
        categoryMap.set(cat.id, cat);
      }

      const fallbackCategory: Category = {
        id: 0,
        name: 'General',
        icon: 'CircleDot',
        color: '#64748B',
        type: 'expense',
      };

      const enrichedTransactions: TransactionWithCategory[] = monthTransactions.map(
        (tx) => ({
          ...tx,
          category: categoryMap.get(tx.categoryId) ?? fallbackCategory,
        })
      );

      let totalIncome = 0;
      let totalExpense = 0;
      const spentByCategory = new Map<number, number>();

      for (const tx of monthTransactions) {
        if (tx.type === 'income') {
          totalIncome += tx.amount;
        } else {
          totalExpense += tx.amount;
          const prev = spentByCategory.get(tx.categoryId) ?? 0;
          spentByCategory.set(tx.categoryId, prev + tx.amount);
        }
      }

      const budgetByCategory = new Map<number, { id: number; limitAmount: number }>();
      let totalBudgetLimit = 0;

      for (const b of monthBudgets) {
        budgetByCategory.set(b.categoryId, { id: b.id, limitAmount: b.limitAmount });
        totalBudgetLimit += b.limitAmount;
      }

      const expenseCategories = allCategories.filter((c) => c.type === 'expense');

      const budgetStatuses: CategoryBudgetStatus[] = expenseCategories.map((cat) => {
        const budgetInfo = budgetByCategory.get(cat.id);
        const limitAmount = budgetInfo?.limitAmount ?? 0;
        const spentAmount = spentByCategory.get(cat.id) ?? 0;
        const remainingAmount = limitAmount - spentAmount;
        const percentage = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0;

        let alertLevel: BudgetAlertLevel = 'normal';
        if (limitAmount > 0) {
          if (percentage >= 100) {
            alertLevel = 'danger';
          } else if (percentage >= 80) {
            alertLevel = 'warning';
          }
        }

        return {
          category: cat,
          budgetId: budgetInfo?.id ?? null,
          limitAmount,
          spentAmount,
          remainingAmount,
          percentage,
          alertLevel,
        };
      });

      const budgetUsedPercentage =
        totalBudgetLimit > 0 ? (totalExpense / totalBudgetLimit) * 100 : 0;

      set({
        categories: allCategories,
        transactions: enrichedTransactions,
        budgetStatuses,
        balanceSummary: {
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
          totalBudgetLimit,
          budgetUsedPercentage,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Error al cargar datos del mes:', error);
      set({ isLoading: false });
    }
  },

  setSelectedMonth: async (month: string) => {
    set({ selectedMonth: month });
    await get().refreshData();
  },

  goToPreviousMonth: async () => {
    const next = shiftMonth(get().selectedMonth, -1);
    set({ selectedMonth: next });
    await get().refreshData();
  },

  goToNextMonth: async () => {
    const next = shiftMonth(get().selectedMonth, 1);
    set({ selectedMonth: next });
    await get().refreshData();
  },

  setCurrency: (currency: CurrencyOption) => {
    set({ currency });
  },

  openTransactionModal: (defaultType: TransactionType = 'expense') => {
    set({ isTransactionModalOpen: true, presetTransactionType: defaultType });
  },

  closeTransactionModal: () => {
    set({ isTransactionModalOpen: false });
  },

  addTransaction: async (input: CreateTransactionInput) => {
    await db.insert(transactions).values({
      amount: input.amount,
      type: input.type,
      categoryId: input.categoryId,
      date: input.date,
      note: input.note?.trim() || null,
    });
    await get().refreshData();
  },

  deleteTransaction: async (id: number) => {
    await db.delete(transactions).where(eq(transactions.id, id));
    await get().refreshData();
  },

  upsertBudgetLimit: async (categoryId: number, limitAmountInCents: number) => {
    const { selectedMonth } = get();
    const existing = await db
      .select()
      .from(budgets)
      .where(
        and(eq(budgets.categoryId, categoryId), eq(budgets.month, selectedMonth))
      );

    if (existing.length > 0) {
      await db
        .update(budgets)
        .set({ limitAmount: limitAmountInCents })
        .where(eq(budgets.id, existing[0].id));
    } else {
      await db.insert(budgets).values({
        categoryId,
        month: selectedMonth,
        limitAmount: limitAmountInCents,
      });
    }

    await get().refreshData();
  },

  restoreExcelData: async () => {
    const { selectedMonth } = get();
    await importExcelSeedData(selectedMonth);
    await get().refreshData();
  },
}));
