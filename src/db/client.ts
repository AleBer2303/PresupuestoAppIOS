import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { count, eq } from 'drizzle-orm';
import * as schema from './schema.ts';
import { EXCEL_DEFAULT_MONTH, EXCEL_SEED_ITEMS } from './excelSeedData.ts';
import { createWebFallbackSQLiteClient } from './webSqliteFallback.ts';

export const DATABASE_NAME = 'presupuesto_app.db';

export interface SQLiteClientLike {
  execSync: (source: string) => void;
  prepareSync: (source: string) => unknown;
}

let sqliteClientInstance: SQLiteClientLike | null = null;
let drizzleDbInstance: ExpoSQLiteDatabase<typeof schema> | null = null;
let isInitialized = false;

/**
 * Obtiene o inicializa perezosamente la instancia de SQLite.
 * En iOS/Android usa `expo-sqlite` nativo; en Web sin `SharedArrayBuffer` o para evitar
 * bloqueos síncronos de Web Worker usa el motor síncrono compatible con Drizzle persistido en `localStorage`.
 */
export function getSQLiteClient(): SQLiteClientLike {
  if (!sqliteClientInstance) {
    const isBrowserWeb =
      typeof globalThis !== 'undefined' &&
      'window' in globalThis &&
      'document' in globalThis;

    if (isBrowserWeb && typeof SharedArrayBuffer === 'undefined') {
      sqliteClientInstance = createWebFallbackSQLiteClient(true);
      return sqliteClientInstance;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SQLite = require('expo-sqlite') as typeof import('expo-sqlite');
      sqliteClientInstance = SQLite.openDatabaseSync(DATABASE_NAME, {
        enableChangeListener: true,
      });
    } catch {
      sqliteClientInstance = createWebFallbackSQLiteClient(true);
    }
  }
  return sqliteClientInstance;
}

/**
 * Obtiene la instancia tipada de Drizzle ORM conectada a SQLite
 */
export function getDb(): ExpoSQLiteDatabase<typeof schema> {
  if (!drizzleDbInstance) {
    const client = getSQLiteClient();
    drizzleDbInstance = drizzle(client as never, { schema });
  }
  return drizzleDbInstance;
}

/**
 * Proxy compatible hacia `getDb()` para mantener la sintaxis `db.select() / db.insert() / db.update() / db.delete()`
 */
export const db: ExpoSQLiteDatabase<typeof schema> = new Proxy(
  {} as ExpoSQLiteDatabase<typeof schema>,
  {
    get(_target, prop, receiver) {
      const instance = getDb();
      const value = Reflect.get(instance, prop, receiver);
      return typeof value === 'function' ? value.bind(instance) : value;
    },
  }
);

/**
 * Permite inyectar un cliente SQLite en memoria (ej: node:sqlite en pruebas automatizadas)
 */
export function configureCustomSQLiteClient(client: SQLiteClientLike): void {
  sqliteClientInstance = client;
  drizzleDbInstance = drizzle(client as never, { schema });
  isInitialized = false;
}

/**
 * Crea las tablas SQLite e índices requeridos por el esquema
 */
export function createSchemaTables(
  client: Pick<SQLiteClientLike, 'execSync'> = getSQLiteClient()
): void {
  client.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      category_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      limit_amount INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS budgets_category_month_idx
      ON budgets (category_id, month);

    CREATE INDEX IF NOT EXISTS transactions_date_idx
      ON transactions (date);
  `);
}

/**
 * Importa las categorías, presupuestos y transacciones iniciales desde los datos del Excel
 * (`Control Ingresos y gastos mensuales.xlsx` - Octubre 2026).
 */
export async function importExcelSeedData(
  targetMonth: string = EXCEL_DEFAULT_MONTH
): Promise<void> {
  const database = getDb();

  // Limpiamos datos previos para garantizar que la semilla del Excel quede exacta y sin duplicados
  await database.delete(schema.transactions);
  await database.delete(schema.budgets);
  await database.delete(schema.categories);

  const categoryValues: schema.NewCategory[] = EXCEL_SEED_ITEMS.map((item) => ({
    name: item.name,
    icon: item.icon,
    color: item.color,
    type: item.type,
  }));

  await database.insert(schema.categories).values(categoryValues);

  const insertedCategories = await database.select().from(schema.categories);
  const categoryByName = new Map<string, schema.Category>();
  for (const cat of insertedCategories) {
    categoryByName.set(cat.name, cat);
  }

  // 1. Insertar Presupuestos Mensuales (Gastos Fijos + Gastos Variables del Excel = $3,350,000)
  const budgetRows: schema.NewBudget[] = [];
  for (const item of EXCEL_SEED_ITEMS) {
    if (item.type === 'expense') {
      const cat = categoryByName.get(item.name);
      if (cat) {
        budgetRows.push({
          categoryId: cat.id,
          month: targetMonth,
          limitAmount: item.plannedAmountCents,
        });
      }
    }
  }

  if (budgetRows.length > 0) {
    await database.insert(schema.budgets).values(budgetRows);
  }

  // 2. Insertar Movimientos del Excel (Ingresos = $6,100,000 y Gastos = $3,350,000)
  const transactionRows: schema.NewTransaction[] = [];
  for (const item of EXCEL_SEED_ITEMS) {
    const cat = categoryByName.get(item.name);
    if (cat) {
      const daySuffix = item.defaultDay.slice(8, 10) || '01';
      transactionRows.push({
        amount: item.plannedAmountCents,
        type: item.type,
        categoryId: cat.id,
        date: `${targetMonth}-${daySuffix}T12:00:00.000Z`,
        note: `${item.group}: ${item.defaultNote}`,
      });
    }
  }

  if (transactionRows.length > 0) {
    await database.insert(schema.transactions).values(transactionRows);
  }
}

/**
 * Inicializa las tablas SQLite y verifica que las categorías y datos del Excel estén cargados.
 */
export async function initializeDatabase(): Promise<void> {
  if (isInitialized) return;

  createSchemaTables(getSQLiteClient());

  const database = getDb();
  const existingCategories = await database
    .select({ total: count() })
    .from(schema.categories);
  const totalCount = existingCategories[0]?.total ?? 0;

  // Verificamos si ya existe la categoría insignia del Excel ("Cuota FUNFAMI")
  const excelCategoryCheck = await database
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.name, 'Cuota FUNFAMI'));

  if (totalCount === 0 || excelCategoryCheck.length === 0) {
    await importExcelSeedData(EXCEL_DEFAULT_MONTH);
  }

  isInitialized = true;
}
