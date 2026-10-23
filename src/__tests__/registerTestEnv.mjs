import { registerHooks } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = process.cwd();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'expo-sqlite') {
      return {
        url: 'data:text/javascript,export const addDatabaseChangeListener = () => ({ remove() {} }); export const openDatabaseSync = () => ({ execSync() {}, prepareSync() {} });',
        shortCircuit: true,
      };
    }

    if (specifier.startsWith('@/')) {
      const relPath = specifier.slice(2);
      const targetWithTs = path.resolve(rootDir, 'src', `${relPath}.ts`);
      return {
        url: pathToFileURL(targetWithTs).href,
        shortCircuit: true,
      };
    }

    return nextResolve(specifier, context);
  },
});
