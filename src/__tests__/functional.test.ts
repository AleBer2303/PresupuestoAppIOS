import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createInMemorySQLiteClient } from './sqliteMemoryAdapter.ts';
import { configureCustomSQLiteClient } from '../db/client.ts';
import { createWebFallbackSQLiteClient } from '../db/webSqliteFallback.ts';
import {
  EXCEL_DEFAULT_MONTH,
  EXCEL_SEED_ITEMS,
  EXCEL_TOTAL_EXPENSE_CENTS,
  EXCEL_TOTAL_INCOME_CENTS,
} from '../db/excelSeedData.ts';
import { useFinanceStore } from '../store/useFinanceStore.ts';
import {
  CURRENCIES,
  formatCurrencyFromCents,
  formatDateGroupHeader,
  formatMonthLabel,
  parseInputToCents,
  shiftMonth,
} from '../utils/formatters.ts';

describe('1. Configuración de Bundling (Expo SQLite wa-sqlite.wasm & Metro)', () => {
  it('incluye soporte para .wasm y .sql en metro.config.js y cabeceras COOP/COEP', () => {
    const metroPath = path.resolve('metro.config.js');
    const metroContent = fs.readFileSync(metroPath, 'utf8');

    assert.ok(
      metroContent.includes("assetExts.push('wasm')"),
      'metro.config.js debe registrar .wasm en resolver.assetExts para wa-sqlite.wasm'
    );
    assert.ok(
      metroContent.includes("sourceExts.push('sql')"),
      'metro.config.js debe registrar .sql en resolver.sourceExts para Drizzle ORM'
    );
    assert.ok(
      metroContent.includes('Cross-Origin-Opener-Policy'),
      'metro.config.js debe configurar cabeceras COOP/COEP para SharedArrayBuffer en Web'
    );
  });

  it('configura web.output como "single" en app.json para evitar el fallo SSR en @expo/router-server', () => {
    const appJsonPath = path.resolve('app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')) as {
      expo?: { web?: { output?: string } };
    };

    assert.equal(
      appJson.expo?.web?.output,
      'single',
      'app.json debe usar web.output = "single" para aplicaciones offline-first con SQLite'
    );
  });

  it('configura darkMode: "class" en tailwind.config.js para evitar el error de color-scheme en Web con NativeWind', () => {
    const tailwindPath = path.resolve('tailwind.config.js');
    const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');

    assert.ok(
      tailwindContent.includes("darkMode: 'class'") ||
        tailwindContent.includes('darkMode: "class"'),
      'tailwind.config.js debe definir darkMode: "class" para react-native-css-interop en Web'
    );
  });
});

describe('2. Datos Importados del Excel (Control Ingresos y gastos mensuales.xlsx)', () => {
  it('contiene las 13 categorías (3 ingresos y 10 gastos incluyendo "Otro / Imprevisto")', () => {
    const incomes = EXCEL_SEED_ITEMS.filter((i) => i.type === 'income');
    const expenses = EXCEL_SEED_ITEMS.filter((i) => i.type === 'expense');

    assert.equal(EXCEL_SEED_ITEMS.length, 13);
    assert.equal(incomes.length, 3);
    assert.equal(expenses.length, 10);

    const expectedNames = [
      'Salario Principal',
      'Prima',
      'Otros Ingresos Variables',
      'CB300F',
      'Cuota FUNFAMI',
      'Plan de celular y baño Kabir',
      'Seguro TR SURA',
      'ETB O Alexandra',
      'Parqueadero CEM',
      'Gasolina Moto/Carro',
      'Tarjeta Nu',
      'Smart Fit',
      'Otro / Imprevisto',
    ];

    assert.deepEqual(
      EXCEL_SEED_ITEMS.map((i) => i.name),
      expectedNames
    );
  });

  it('calcula los totales exactos del Excel en centavos ($6,100,000 ingresos y $3,350,000 gastos)', () => {
    assert.equal(EXCEL_TOTAL_INCOME_CENTS, 610_000_000); // $6,100,000.00
    assert.equal(EXCEL_TOTAL_EXPENSE_CENTS, 335_000_000); // $3,350,000.00
    assert.equal(
      EXCEL_TOTAL_INCOME_CENTS - EXCEL_TOTAL_EXPENSE_CENTS,
      275_000_000 // $2,750,000.00 flujo neto
    );
  });
});

describe('3. Pruebas Funcionales End-to-End (SQLite + Drizzle ORM + Zustand)', () => {
  beforeEach(async () => {
    const memoryClient = createInMemorySQLiteClient();
    configureCustomSQLiteClient(memoryClient);

    useFinanceStore.setState({
      isReady: false,
      isLoading: false,
      selectedMonth: EXCEL_DEFAULT_MONTH,
      currency: CURRENCIES[0],
      categories: [],
      transactions: [],
      budgetStatuses: [],
      isTransactionModalOpen: false,
    });

    await useFinanceStore.getState().initializeApp();
  });

  it('inicializa la base de datos SQLite y carga categorías, presupuestos y transacciones del Excel', () => {
    const state = useFinanceStore.getState();

    assert.equal(state.isReady, true);
    assert.equal(state.categories.length, 13);
    assert.equal(state.transactions.length, 12);
    assert.equal(state.budgetStatuses.length, 10);

    const imprevistoCat = state.categories.find(
      (c) => c.name === 'Otro / Imprevisto'
    );
    assert.ok(imprevistoCat, 'Debe existir la categoría "Otro / Imprevisto"');
    assert.equal(imprevistoCat?.type, 'expense');

    assert.equal(state.balanceSummary.totalIncome, 610_000_000);
    assert.equal(state.balanceSummary.totalExpense, 335_000_000);
    assert.equal(state.balanceSummary.netBalance, 275_000_000);
    assert.equal(state.balanceSummary.totalBudgetLimit, 335_000_000);
    assert.equal(state.balanceSummary.budgetUsedPercentage, 100);
  });

  it('permite registrar un nuevo gasto e ingreso y recalcula el balance automáticamente', async () => {
    const store = useFinanceStore.getState();
    const smartFitCategory = store.categories.find((c) => c.name === 'Smart Fit');
    const salarioCategory = store.categories.find(
      (c) => c.name === 'Salario Principal'
    );

    if (!smartFitCategory) throw new Error('Debe existir la categoría Smart Fit');
    if (!salarioCategory) throw new Error('Debe existir la categoría Salario Principal');

    // Agregar gasto adicional de $50,000 (5,000,000 centavos)
    await store.addTransaction({
      amount: 5_000_000,
      type: 'expense',
      categoryId: smartFitCategory.id,
      date: `${EXCEL_DEFAULT_MONTH}-25T12:00:00.000Z`,
      note: 'Suplementos gimnasio',
    });

    let updated = useFinanceStore.getState();
    assert.equal(updated.transactions.length, 13);
    assert.equal(updated.balanceSummary.totalExpense, 340_000_000);
    assert.equal(updated.balanceSummary.netBalance, 270_000_000);

    // Agregar ingreso adicional de $200,000 (20,000,000 centavos)
    await updated.addTransaction({
      amount: 20_000_000,
      type: 'income',
      categoryId: salarioCategory.id,
      date: `${EXCEL_DEFAULT_MONTH}-26T12:00:00.000Z`,
      note: 'Bono productividad',
    });

    updated = useFinanceStore.getState();
    assert.equal(updated.transactions.length, 14);
    assert.equal(updated.balanceSummary.totalIncome, 630_000_000);
    assert.equal(updated.balanceSummary.netBalance, 290_000_000);
  });

  it('permite eliminar una transacción y actualiza el resumen de balance', async () => {
    const initial = useFinanceStore.getState();
    const txToDelete = initial.transactions.find(
      (tx) => tx.category.name === 'Smart Fit'
    );
    if (!txToDelete) throw new Error('Debe existir la transacción de Smart Fit');

    await initial.deleteTransaction(txToDelete.id);

    const updated = useFinanceStore.getState();
    assert.equal(updated.transactions.length, 11);
    assert.equal(updated.balanceSummary.totalExpense, 325_000_000);
    assert.equal(updated.balanceSummary.netBalance, 285_000_000);
  });

  it('evalúa correctamente las alertas visuales de presupuesto (<80% normal, >=80% warning, >=100% danger)', async () => {
    const initial = useFinanceStore.getState();
    const gasolinaCat = initial.categories.find(
      (c) => c.name === 'Gasolina Moto/Carro'
    );
    if (!gasolinaCat) throw new Error('Debe existir la categoría Gasolina Moto/Carro');

    // En la semilla del Excel, Gasolina tiene gasto = $200,000 (20,000,000 centavos)
    // 1) Si subimos el límite a $300,000 (30,000,000 centavos) -> 66.67% -> 'normal'
    await initial.upsertBudgetLimit(gasolinaCat.id, 30_000_000);
    let status = useFinanceStore
      .getState()
      .budgetStatuses.find((b) => b.category.id === gasolinaCat.id);
    assert.equal(status?.alertLevel, 'normal');

    // 2) Si ajustamos el límite a $240,000 (24,000,000 centavos) -> 83.33% -> 'warning' (>= 80%)
    await initial.upsertBudgetLimit(gasolinaCat.id, 24_000_000);
    status = useFinanceStore
      .getState()
      .budgetStatuses.find((b) => b.category.id === gasolinaCat.id);
    assert.equal(status?.alertLevel, 'warning');
    assert.ok((status?.percentage ?? 0) >= 80 && (status?.percentage ?? 0) < 100);

    // 3) Si ajustamos el límite a $180,000 (18,000,000 centavos) -> 111.11% -> 'danger' (>= 100%)
    await initial.upsertBudgetLimit(gasolinaCat.id, 18_000_000);
    status = useFinanceStore
      .getState()
      .budgetStatuses.find((b) => b.category.id === gasolinaCat.id);
    assert.equal(status?.alertLevel, 'danger');
    assert.ok((status?.percentage ?? 0) >= 100);
  });

  it('aísla transacciones y presupuestos al cambiar de mes (filtro mensual YYYY-MM)', async () => {
    const store = useFinanceStore.getState();
    assert.equal(store.selectedMonth, '2026-10');

    await store.goToNextMonth();
    let updated = useFinanceStore.getState();
    assert.equal(updated.selectedMonth, '2026-11');
    assert.equal(updated.transactions.length, 0);
    assert.equal(updated.balanceSummary.totalIncome, 0);
    assert.equal(updated.balanceSummary.totalExpense, 0);

    await updated.goToPreviousMonth();
    updated = useFinanceStore.getState();
    assert.equal(updated.selectedMonth, '2026-10');
    assert.equal(updated.transactions.length, 12);
  });

  it('funciona en navegadores Web sin SharedArrayBuffer usando el motor de respaldo Web SQLite + Drizzle ORM', async () => {
    const webClient = createWebFallbackSQLiteClient(false);
    configureCustomSQLiteClient(webClient);

    useFinanceStore.setState({
      isReady: false,
      isLoading: false,
      selectedMonth: EXCEL_DEFAULT_MONTH,
      categories: [],
      transactions: [],
      budgetStatuses: [],
    });

    await useFinanceStore.getState().initializeApp();
    let state = useFinanceStore.getState();

    assert.equal(state.isReady, true);
    assert.equal(state.categories.length, 13);
    assert.equal(state.transactions.length, 12);
    assert.equal(state.balanceSummary.totalIncome, 610_000_000);
    assert.equal(state.balanceSummary.totalExpense, 335_000_000);

    const nuCat = state.categories.find((c) => c.name === 'Tarjeta Nu');
    if (!nuCat) throw new Error('Debe existir categoría Tarjeta Nu en Web fallback');

    await state.addTransaction({
      amount: 10_000_000,
      type: 'expense',
      categoryId: nuCat.id,
      date: `${EXCEL_DEFAULT_MONTH}-28T12:00:00.000Z`,
      note: 'Compra online web',
    });

    state = useFinanceStore.getState();
    assert.equal(state.transactions.length, 13);
    assert.equal(state.balanceSummary.totalExpense, 345_000_000);

    await state.upsertBudgetLimit(nuCat.id, 35_000_000);
    state = useFinanceStore.getState();
    const nuBudget = state.budgetStatuses.find((b) => b.category.id === nuCat.id);
    assert.equal(nuBudget?.limitAmount, 35_000_000);
    assert.equal(nuBudget?.alertLevel, 'danger'); // 400k / 350k > 100%
  });
});

describe('4. Utilidades de Formato y Conversión (formatters.ts)', () => {
  it('convierte strings numéricos a centavos de forma exacta', () => {
    assert.equal(parseInputToCents('4000000'), 400_000_000);
    assert.equal(parseInputToCents('125.50'), 12_550);
    assert.equal(parseInputToCents('125,50'), 12_550);
    assert.equal(parseInputToCents('-50'), 0);
    assert.equal(parseInputToCents('abc'), 0);
  });

  it('desplaza meses YYYY-MM y formatea etiquetas en español', () => {
    assert.equal(shiftMonth('2026-10', 1), '2026-11');
    assert.equal(shiftMonth('2026-10', -1), '2026-09');
    assert.equal(shiftMonth('2026-12', 1), '2027-01');
    assert.equal(formatMonthLabel('2026-10'), 'Octubre 2026');
  });

  it('formatea encabezados de agrupación de fecha (Hoy / Ayer) y montos', () => {
    const refDate = new Date('2026-10-23T12:00:00.000Z');
    assert.ok(formatDateGroupHeader('2026-10-23', refDate).startsWith('Hoy ·'));
    assert.ok(formatDateGroupHeader('2026-10-22', refDate).startsWith('Ayer ·'));

    const formattedCop = formatCurrencyFromCents(400_000_000, CURRENCIES[0]);
    assert.ok(
      formattedCop.includes('4.000.000') || formattedCop.includes('4,000,000'),
      `Formato COP inesperado: ${formattedCop}`
    );
  });
});
