import assert from 'node:assert/strict';
import test from 'node:test';

import { assertSafeRestoreDrill, parseDatabaseTarget, postgresClientEnvironment } from './veygritShipBackupRestore';

test('parses PostgreSQL connection details without returning a printable URL', () => {
  const target = parseDatabaseTarget('postgresql://ship_user:p%40ss@db.internal:5433/veygrit_ship_restore_drill');
  assert.deepEqual(target, { host: 'db.internal', port: '5433', user: 'ship_user', password: 'p@ss', database: 'veygrit_ship_restore_drill' });
});

test('restore drills require an isolated, explicitly named non-production target', () => {
  const source = 'postgresql://user:pw@source.internal/veygrit_ship';
  assert.throws(() => assertSafeRestoreDrill(source, source, 'RESTORE_DRILL_ONLY'), /different/);
  assert.throws(() => assertSafeRestoreDrill(source, 'postgresql://user:pw@target.internal/veygrit_ship', 'RESTORE_DRILL_ONLY'), /target database name/);
  assert.throws(() => assertSafeRestoreDrill(source, 'postgresql://user:pw@target.internal/veygrit_ship_prod_restore_drill', 'RESTORE_DRILL_ONLY'), /production/);
  assert.doesNotThrow(() => assertSafeRestoreDrill(source, 'postgresql://user:pw@target.internal/veygrit_ship_restore_drill', 'RESTORE_DRILL_ONLY'));
});

test('credentials are passed through process environment rather than command arguments', () => {
  const environment = postgresClientEnvironment(parseDatabaseTarget('postgresql://user:private@db.internal/veygrit_ship_restore_drill'));
  assert.equal(environment.PGPASSWORD, 'private');
  assert.equal(environment.PGDATABASE, 'veygrit_ship_restore_drill');
});
