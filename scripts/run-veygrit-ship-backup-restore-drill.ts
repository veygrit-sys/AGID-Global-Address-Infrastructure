import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { Pool } from 'pg';

import { assertSafeRestoreDrill, postgresClientEnvironment } from '../src/server/ops/veygritShipBackupRestore';

const execFile = promisify(execFileCallback);
const SHIP_TABLE_PATTERN = /^veygrit_ship_[a-z0-9_]+$/;

async function tableCounts(connectionString: string): Promise<Record<string, number>> {
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000 });
  try {
    const tables = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name LIKE 'veygrit_ship_%'
       ORDER BY table_name`,
    );
    const counts: Record<string, number> = {};
    for (const { table_name: tableName } of tables.rows) {
      if (!SHIP_TABLE_PATTERN.test(tableName)) throw new Error('Unexpected shipping table identifier.');
      const result = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "${tableName}"`);
      counts[tableName] = Number(result.rows[0]?.count ?? 0);
    }
    return counts;
  } finally {
    await pool.end();
  }
}

async function userTableCount(connectionString: string): Promise<number> {
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000 });
  try {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM information_schema.tables
       WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_type='BASE TABLE'`,
    );
    return Number(result.rows[0]?.count ?? 0);
  } finally {
    await pool.end();
  }
}

async function main() {
  if (!process.argv.includes('--execute')) {
    console.log('Dry check passed. Use --execute with isolated source/target environment variables to run the restore drill.');
    return;
  }
  const sourceUrl = process.env.VEYGRIT_SHIP_BACKUP_SOURCE_DATABASE_URL ?? '';
  const targetUrl = process.env.VEYGRIT_SHIP_RESTORE_TARGET_DATABASE_URL ?? '';
  const confirmation = process.env.VEYGRIT_SHIP_RESTORE_DRILL_CONFIRM ?? '';
  if (!sourceUrl || !targetUrl) throw new Error('Both backup source and restore target database URLs are required.');
  const { source, target } = assertSafeRestoreDrill(sourceUrl, targetUrl, confirmation);
  if (await userTableCount(targetUrl) !== 0) throw new Error('Restore-drill target must be an empty database created from template0.');

  const work = await mkdtemp(path.join(tmpdir(), 'veygrit-ship-restore-drill-'));
  const archive = path.join(work, 'veygrit-ship.dump');
  const started = Date.now();
  try {
    const before = await tableCounts(sourceUrl);
    if (!Object.keys(before).length) throw new Error('No veygrit_ship_* tables were found in the source database.');
    await execFile('pg_dump', [
      '--format=custom', '--no-owner', '--no-acl', '--table=public.veygrit_ship_*', '--file', archive,
    ], { env: postgresClientEnvironment(source), windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
    await execFile('pg_restore', [
      '--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', '--dbname', target.database, archive,
    ], { env: postgresClientEnvironment(target), windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
    const after = await tableCounts(targetUrl);
    assertCountsEqual(before, after);
    console.log(JSON.stringify({
      ok: true,
      event: 'veygrit_ship.backup_restore_drill.completed',
      tableCount: Object.keys(before).length,
      rowCount: Object.values(before).reduce((total, count) => total + count, 0),
      durationMs: Date.now() - started,
    }));
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

export function assertCountsEqual(before: Record<string, number>, after: Record<string, number>): void {
  const beforeEntries = Object.entries(before).sort(([a], [b]) => a.localeCompare(b));
  const afterEntries = Object.entries(after).sort(([a], [b]) => a.localeCompare(b));
  if (JSON.stringify(beforeEntries) !== JSON.stringify(afterEntries)) throw new Error('Restored table counts do not match the backup source.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Backup/restore drill failed.');
  process.exit(1);
});
