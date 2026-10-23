declare module 'node:test' {
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
}

declare module 'node:assert/strict' {
  const assert: {
    ok(value: unknown, message?: string): asserts value;
    equal<T>(actual: T, expected: T, message?: string): void;
    deepEqual<T>(actual: T, expected: T, message?: string): void;
  };
  export default assert;
}

declare module 'node:fs' {
  const fs: {
    readFileSync(filePath: string, encoding: 'utf8'): string;
  };
  export default fs;
}

declare module 'node:path' {
  const path: {
    resolve(...segments: string[]): string;
  };
  export default path;
}

declare module 'node:sqlite' {
  export type SQLInputValue = null | number | bigint | string | Uint8Array;

  export interface StatementSync {
    all(...params: SQLInputValue[]): Record<string, unknown>[];
    run(...params: SQLInputValue[]): {
      changes: number | bigint;
      lastInsertRowid: number | bigint;
    };
  }

  export class DatabaseSync {
    constructor(location: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
