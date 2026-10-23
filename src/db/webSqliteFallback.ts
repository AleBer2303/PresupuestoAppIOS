import type { SQLiteClientLike } from './client.ts';

type RowRecord = Record<string, unknown>;

interface TableStore {
  categories: RowRecord[];
  transactions: RowRecord[];
  budgets: RowRecord[];
  seq: {
    categories: number;
    transactions: number;
    budgets: number;
  };
}

type TableName = 'categories' | 'transactions' | 'budgets';

const STORAGE_KEY = 'presupuesto_app_sqlite_web_v1';

function createEmptyStore(): TableStore {
  return {
    categories: [],
    transactions: [],
    budgets: [],
    seq: {
      categories: 1,
      transactions: 1,
      budgets: 1,
    },
  };
}

function loadStoreFromWebStorage(): TableStore {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      const raw = globalThis.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TableStore>;
        if (
          Array.isArray(parsed.categories) &&
          Array.isArray(parsed.transactions) &&
          Array.isArray(parsed.budgets) &&
          parsed.seq
        ) {
          return {
            categories: parsed.categories,
            transactions: parsed.transactions,
            budgets: parsed.budgets,
            seq: {
              categories: Number(parsed.seq.categories) || 1,
              transactions: Number(parsed.seq.transactions) || 1,
              budgets: Number(parsed.seq.budgets) || 1,
            },
          };
        }
      }
    }
  } catch {
    // Ignore storage read errors in restricted environments
  }
  return createEmptyStore();
}

function saveStoreToWebStorage(store: TableStore): void {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch {
    // Ignore storage write errors
  }
}

const TABLE_COLUMNS: Record<TableName, string[]> = {
  categories: ['id', 'name', 'icon', 'color', 'type'],
  transactions: ['id', 'amount', 'type', 'category_id', 'date', 'note'],
  budgets: ['id', 'category_id', 'month', 'limit_amount'],
};

function parseTableName(sql: string): TableName | null {
  const match = sql.match(/(?:from|into|update)\s+"?(categories|transactions|budgets)"?/i);
  if (!match) return null;
  return match[1].toLowerCase() as TableName;
}

function matchWhereClause(
  row: RowRecord,
  whereSql: string | undefined,
  params: unknown[],
  paramOffset: { index: number }
): boolean {
  if (!whereSql) return true;

  // Dividir condiciones unidas por AND
  const conditions = whereSql
    .replace(/^\(|\)$/g, '')
    .split(/\s+and\s+/i)
    .map((c) => c.trim());

  for (const cond of conditions) {
    const likeMatch = cond.match(/(?:"?\w+"?\.)?"?(\w+)"?\s+like\s+\?/i);
    if (likeMatch) {
      const col = likeMatch[1];
      const pattern = String(params[paramOffset.index++] ?? '');
      const val = String(row[col] ?? '');
      if (pattern.endsWith('%')) {
        const prefix = pattern.slice(0, -1);
        if (!val.startsWith(prefix)) return false;
      } else if (val !== pattern) {
        return false;
      }
      continue;
    }

    const eqMatch = cond.match(/(?:"?\w+"?\.)?"?(\w+)"?\s*=\s*\?/i);
    if (eqMatch) {
      const col = eqMatch[1];
      const expected = params[paramOffset.index++];
      if (row[col] !== expected) return false;
      continue;
    }
  }

  return true;
}

/**
 * Cliente SQLite síncrono de respaldo para navegadores Web donde `SharedArrayBuffer`
 * no está disponible (ej: contextos sin aislamiento COOP/COEP o acceso por IP LAN).
 * Compatible con `drizzle-orm/expo-sqlite` y persistido en `localStorage`.
 */
export function createWebFallbackSQLiteClient(persistToLocalStorage = true): SQLiteClientLike {
  const store: TableStore = persistToLocalStorage
    ? loadStoreFromWebStorage()
    : createEmptyStore();

  const persist = () => {
    if (persistToLocalStorage) {
      saveStoreToWebStorage(store);
    }
  };

  const executeStatement = (sqlSource: string, params: unknown[]) => {
    const sql = sqlSource.trim();
    const upper = sql.toUpperCase();
    const table = parseTableName(sql);

    if (!table) {
      return {
        changes: 0,
        lastInsertRowId: 0,
        objectRows: [] as RowRecord[],
        arrayRows: [] as unknown[][],
      };
    }

    // 1. SELECT
    if (upper.startsWith('SELECT')) {
      const whereSplit = sql.split(/\s+where\s+/i);
      const afterWhere = whereSplit[1];
      const orderSplit = (afterWhere ?? sql).split(/\s+order\s+by\s+/i);
      const whereClause = afterWhere ? orderSplit[0] : undefined;
      const orderClause = afterWhere ? orderSplit[1] : sql.split(/\s+order\s+by\s+/i)[1];

      let filtered = store[table].filter((r) =>
        matchWhereClause(r, whereClause, params, { index: 0 })
      );

      // COUNT(*)
      if (/count\s*\(\s*\*\s*\)/i.test(sql)) {
        const total = filtered.length;
        return {
          changes: 0,
          lastInsertRowId: 0,
          objectRows: [{ count: total }],
          arrayRows: [[total]],
        };
      }

      // ORDER BY
      if (orderClause) {
        const orderParts = orderClause.split(',').map((p) => p.trim());
        filtered = [...filtered].sort((a, b) => {
          for (const part of orderParts) {
            const m = part.match(/(?:"?\w+"?\.)?"?(\w+)"?(?:\s+(asc|desc))?/i);
            if (!m) continue;
            const col = m[1];
            const isDesc = (m[2] ?? 'asc').toLowerCase() === 'desc';
            const va = a[col];
            const vb = b[col];
            if (va === vb) continue;
            if (typeof va === 'number' && typeof vb === 'number') {
              return isDesc ? vb - va : va - vb;
            }
            const cmp = String(va ?? '').localeCompare(String(vb ?? ''));
            return isDesc ? -cmp : cmp;
          }
          return 0;
        });
      }

      const cols = TABLE_COLUMNS[table];
      const arrayRows = filtered.map((row) => cols.map((c) => row[c] ?? null));
      return {
        changes: 0,
        lastInsertRowId: 0,
        objectRows: filtered,
        arrayRows,
      };
    }

    // 2. INSERT INTO
    if (upper.startsWith('INSERT')) {
      const colsMatch = sql.match(/\(([^)]+)\)\s*values/i);
      const cols = colsMatch
        ? colsMatch[1]
            .split(',')
            .map((c) => c.trim().replace(/^"|"$/g, ''))
        : TABLE_COLUMNS[table];

      const valuesPart = sql.slice(sql.toLowerCase().indexOf('values') + 6).trim();
      const tupleMatches = valuesPart.match(/\(([^)]+)\)/g) ?? [];

      let paramIdx = 0;
      let lastId = 0;
      let insertedCount = 0;

      for (const tupleStr of tupleMatches) {
        const tokens = tupleStr
          .slice(1, -1)
          .split(',')
          .map((t) => t.trim());

        const newRow: RowRecord = {};
        cols.forEach((col, i) => {
          const token = tokens[i];
          if (token === '?') {
            newRow[col] = params[paramIdx++];
          } else if (token?.toLowerCase() === 'null' || token === undefined) {
            newRow[col] = null;
          } else {
            newRow[col] = token.replace(/^'|'$/g, '');
          }
        });

        if (newRow.id === null || newRow.id === undefined) {
          newRow.id = store.seq[table]++;
        } else {
          const numericId = Number(newRow.id);
          if (numericId >= store.seq[table]) {
            store.seq[table] = numericId + 1;
          }
        }

        lastId = Number(newRow.id);
        store[table].push(newRow);
        insertedCount++;
      }

      persist();
      return {
        changes: insertedCount,
        lastInsertRowId: lastId,
        objectRows: [],
        arrayRows: [],
      };
    }

    // 3. UPDATE
    if (upper.startsWith('UPDATE')) {
      const setMatch = sql.match(/set\s+(.+?)(?:\s+where\s+(.+))?$/i);
      const setClause = setMatch?.[1] ?? '';
      const whereClause = setMatch?.[2];

      const setCols = setClause
        .split(',')
        .map((part) => part.trim().match(/"?(\w+)"?\s*=\s*\?/i)?.[1])
        .filter((c): c is string => Boolean(c));

      const setValues = setCols.map((_, idx) => params[idx]);
      const whereOffset = { index: setCols.length };

      let updatedCount = 0;
      for (const row of store[table]) {
        const currentOffset = { index: whereOffset.index };
        if (matchWhereClause(row, whereClause, params, currentOffset)) {
          setCols.forEach((col, idx) => {
            row[col] = setValues[idx];
          });
          updatedCount++;
        }
      }

      persist();
      return {
        changes: updatedCount,
        lastInsertRowId: 0,
        objectRows: [],
        arrayRows: [],
      };
    }

    // 4. DELETE
    if (upper.startsWith('DELETE')) {
      const whereSplit = sql.split(/\s+where\s+/i);
      const whereClause = whereSplit[1];

      const beforeLen = store[table].length;
      if (!whereClause) {
        store[table] = [];
      } else {
        store[table] = store[table].filter((row) => {
          const offset = { index: 0 };
          return !matchWhereClause(row, whereClause, params, offset);
        });
      }

      const deleted = beforeLen - store[table].length;
      persist();
      return {
        changes: deleted,
        lastInsertRowId: 0,
        objectRows: [],
        arrayRows: [],
      };
    }

    return {
      changes: 0,
      lastInsertRowId: 0,
      objectRows: [],
      arrayRows: [],
    };
  };

  return {
    execSync(): void {
      // Las tablas ya están estructuradas en el store en memoria / localStorage
    },

    prepareSync(source: string) {
      return {
        executeSync(params: unknown[] = []) {
          const res = executeStatement(source, params);
          return {
            changes: res.changes,
            lastInsertRowId: res.lastInsertRowId,
            getAllSync: () => res.objectRows,
            getFirstSync: () => res.objectRows[0] ?? null,
          };
        },
        executeForRawResultSync(params: unknown[] = []) {
          const res = executeStatement(source, params);
          return {
            getAllSync: () => res.arrayRows,
          };
        },
      };
    },
  };
}
