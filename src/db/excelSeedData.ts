import type { TransactionType } from './schema.ts';

export interface ExcelCategorySeed {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  group: 'Ingresos Fijos' | 'Ingresos Variables' | 'Gastos Fijos' | 'Gastos Variables';
  /** Monto previsto en el archivo Excel (en pesos/unidad principal, ej: 4000000) */
  plannedAmount: number;
  /** Monto previsto en centavos para SQLite (ej: 400000000) */
  plannedAmountCents: number;
  defaultNote: string;
  defaultDay: string;
}

export const EXCEL_DEFAULT_MONTH = '2026-10';

/**
 * Datos extraídos directamente de `Control Ingresos y gastos mensuales.xlsx` (Hoja: Octubre 2026)
 * - Total Ingresos Previstos: $6,100,000
 * - Total Gastos Fijos Previstos: $2,950,000
 * - Total Gastos Variables Previstos: $400,000
 * - Total Gastos Previstos: $3,350,000
 * - Flujo Neto Proyectado: $2,750,000
 */
export const EXCEL_SEED_ITEMS: ExcelCategorySeed[] = [
  // === INGRESOS FIJOS ($6,000,000) ===
  {
    name: 'Salario Principal',
    icon: 'Briefcase',
    color: '#10B981',
    type: 'income',
    group: 'Ingresos Fijos',
    plannedAmount: 4_000_000,
    plannedAmountCents: 400_000_000,
    defaultNote: 'Ingreso fijo mensual (Excel Octubre 2026)',
    defaultDay: '2026-10-01',
  },
  {
    name: 'Prima',
    icon: 'Award',
    color: '#059669',
    type: 'income',
    group: 'Ingresos Fijos',
    plannedAmount: 2_000_000,
    plannedAmountCents: 200_000_000,
    defaultNote: 'Ingreso fijo - Prima (Excel Octubre 2026)',
    defaultDay: '2026-10-01',
  },

  // === INGRESOS VARIABLES ($100,000) ===
  {
    name: 'Otros Ingresos Variables',
    icon: 'TrendingUp',
    color: '#34D399',
    type: 'income',
    group: 'Ingresos Variables',
    plannedAmount: 100_000,
    plannedAmountCents: 10_000_000,
    defaultNote: 'Ingresos variables del mes (Excel Octubre 2026)',
    defaultDay: '2026-10-05',
  },

  // === GASTOS FIJOS ($2,950,000) ===
  {
    name: 'CB300F',
    icon: 'Bike',
    color: '#F97316',
    type: 'expense',
    group: 'Gastos Fijos',
    plannedAmount: 500_000,
    plannedAmountCents: 50_000_000,
    defaultNote: 'Gasto fijo - Moto CB300F',
    defaultDay: '2026-10-05',
  },
  {
    name: 'Cuota FUNFAMI',
    icon: 'Landmark',
    color: '#3B82F6',
    type: 'expense',
    group: 'Gastos Fijos',
    plannedAmount: 1_800_000,
    plannedAmountCents: 180_000_000,
    defaultNote: 'Gasto fijo - Cuota FUNFAMI',
    defaultDay: '2026-10-05',
  },
  {
    name: 'Plan de celular y baño Kabir',
    icon: 'Smartphone',
    color: '#06B6D4',
    type: 'expense',
    group: 'Gastos Fijos',
    plannedAmount: 100_000,
    plannedAmountCents: 10_000_000,
    defaultNote: 'Gasto fijo - Plan de celular y baño Kabir',
    defaultDay: '2026-10-10',
  },
  {
    name: 'Seguro TR SURA',
    icon: 'ShieldCheck',
    color: '#8B5CF6',
    type: 'expense',
    group: 'Gastos Fijos',
    plannedAmount: 130_000,
    plannedAmountCents: 13_000_000,
    defaultNote: 'Gasto fijo - Seguro Todo Riesgo SURA',
    defaultDay: '2026-10-12',
  },
  {
    name: 'ETB O Alexandra',
    icon: 'Wifi',
    color: '#14B8A6',
    type: 'expense',
    group: 'Gastos Fijos',
    plannedAmount: 100_000,
    plannedAmountCents: 10_000_000,
    defaultNote: 'Gasto fijo - Internet ETB / Alexandra',
    defaultDay: '2026-10-15',
  },
  {
    name: 'Parqueadero CEM',
    icon: 'Car',
    color: '#6366F1',
    type: 'expense',
    group: 'Gastos Fijos',
    plannedAmount: 120_000,
    plannedAmountCents: 12_000_000,
    defaultNote: 'Gasto fijo - Mensualidad Parqueadero CEM',
    defaultDay: '2026-10-15',
  },
  {
    name: 'Gasolina Moto/Carro',
    icon: 'Fuel',
    color: '#F59E0B',
    type: 'expense',
    group: 'Gastos Fijos',
    plannedAmount: 200_000,
    plannedAmountCents: 20_000_000,
    defaultNote: 'Gasto fijo - Combustible Moto/Carro',
    defaultDay: '2026-10-18',
  },

  // === GASTOS VARIABLES ($400,000) ===
  {
    name: 'Tarjeta Nu',
    icon: 'CreditCard',
    color: '#A855F7',
    type: 'expense',
    group: 'Gastos Variables',
    plannedAmount: 300_000,
    plannedAmountCents: 30_000_000,
    defaultNote: 'Gasto variable - Pago Tarjeta Nu',
    defaultDay: '2026-10-20',
  },
  {
    name: 'Smart Fit',
    icon: 'Dumbbell',
    color: '#EC4899',
    type: 'expense',
    group: 'Gastos Variables',
    plannedAmount: 100_000,
    plannedAmountCents: 10_000_000,
    defaultNote: 'Gasto variable - Mensualidad Gimnasio Smart Fit',
    defaultDay: '2026-10-22',
  },
  {
    name: 'Otro / Imprevisto',
    icon: 'AlertTriangle',
    color: '#EF4444',
    type: 'expense',
    group: 'Gastos Variables',
    plannedAmount: 0,
    plannedAmountCents: 0,
    defaultNote: 'Gasto imprevisto o no programado',
    defaultDay: '2026-10-23',
  },
];

export const EXCEL_TOTAL_INCOME_CENTS = EXCEL_SEED_ITEMS.filter(
  (i) => i.type === 'income'
).reduce((acc, item) => acc + item.plannedAmountCents, 0);

export const EXCEL_TOTAL_EXPENSE_CENTS = EXCEL_SEED_ITEMS.filter(
  (i) => i.type === 'expense'
).reduce((acc, item) => acc + item.plannedAmountCents, 0);
