import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { SQLiteClientLike } from '../db/client.ts';

/**
 * Adaptador de SQLite en memoria basado en `node:sqlite` (nativo de Node 24)
 * compatible con la interfaz síncrona esperada por `drizzle-orm/expo-sqlite`.
 */
export function createInMemorySQLiteClient(): SQLiteClientLike {
  const rawDb = new DatabaseSync(':memory:');

  return {
    execSync(source: string): void {
      rawDb.exec(source);
    },

    prepareSync(source: string) {
      const stmt = rawDb.prepare(source);

      return {
        executeSync(params: SQLInputValue[] = []) {
          const upper = source.trim().toUpperCase();
          const isReader =
            upper.startsWith('SELECT') || upper.startsWith('PRAGMA');

          if (isReader) {
            const rows = stmt.all(...params) as Record<string, unknown>[];
            return {
              changes: 0,
              lastInsertRowId: 0,
              getAllSync: () => rows,
              getFirstSync: () => rows[0] ?? null,
            };
          }

          const result = stmt.run(...params);
          return {
            changes: Number(result.changes),
            lastInsertRowId: Number(result.lastInsertRowid),
            getAllSync: () => [],
            getFirstSync: () => null,
          };
        },

        executeForRawResultSync(params: SQLInputValue[] = []) {
          const rows = stmt.all(...params) as Record<string, unknown>[];
          const arrayRows = rows.map((row) => Object.values(row));
          return {
            getAllSync: () => arrayRows,
          };
        },
      };
    },
  };
}
