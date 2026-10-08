import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const hookSource = readFileSync(join(here, 'useAppDatabasePersistence.ts'), 'utf8');
const appSource = readFileSync(join(here, '..', 'App.tsx'), 'utf8');

test('app database persistence is isolated in a dedicated hook', () => {
  assert.match(hookSource, /export function useAppDatabasePersistence/);
  assert.match(hookSource, /loadAppDatabaseSnapshot/);
  assert.match(hookSource, /persistSavedAgids/);
  assert.match(hookSource, /persistSavedQrs/);
  assert.match(hookSource, /persistRegisteredAddresses/);
  assert.match(hookSource, /persistAoids/);
  assert.match(hookSource, /const loadAppDatabase = \(\) => import\('\.\.\/lib\/appDatabase'\)/);
  assert.doesNotMatch(hookSource, /^import \{[\s\S]*\} from '\.\.\/lib\/appDatabase';/m);
});

test('App delegates durable database synchronization to the persistence hook', () => {
  assert.match(appSource, /useAppDatabasePersistence\(\{/);
  assert.doesNotMatch(appSource, /loadAppDatabaseSnapshot\(/);
  assert.doesNotMatch(appSource, /persistSavedAgids\(/);
});
