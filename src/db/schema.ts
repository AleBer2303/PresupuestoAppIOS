import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export type TransactionType = 'income' | 'expense';

/**
 * Tabla `categories`: Categorías de ingresos y gastos
 */
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).$type<TransactionType>().notNull(),
});

/**
 * Tabla `transactions`: Movimientos financieros (montos almacenados en centavos como entero)
 */
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: integer('amount').notNull(), // En centavos (ej: 15000 = $150.00)
  type: text('type', { enum: ['income', 'expense'] }).$type<TransactionType>().notNull(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // Timestamp ISO 8601 (ej: "2026-10-23T12:00:00.000Z")
  note: text('note'),
});

/**
 * Tabla `budgets`: Presupuestos mensuales por categoría (montos en centavos)
 */
export const budgets = sqliteTable(
  'budgets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    month: text('month').notNull(), // Formato "YYYY-MM" (ej: "2026-10")
    limitAmount: integer('limit_amount').notNull(), // En centavos
  },
  (table) => [
    uniqueIndex('budgets_category_month_idx').on(table.categoryId, table.month),
  ]
);

/**
 * Relaciones de Drizzle ORM
 */
export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

/**
 * Tipos inferidos para TypeScript estricto
 */
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
