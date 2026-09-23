import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

async function main() {
  const connectionString = process.env.VEYGRIT_SHIP_POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('VEYGRIT_SHIP_POSTGRES_URL (or DATABASE_URL) is required.');

  const migrationUrls = [
    new URL('../db/veygrit-ship-core.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-workers.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-guest-access.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-secret-management.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-label-management.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-americas-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-europe-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-asia-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-africa-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-greater-china-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-americas-expansion-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-europe-expansion-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-asia-pacific-expansion-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-africa-expansion-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-mena-expansion-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-private-asia-expansion-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-private-europe-expansion-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-private-greater-china-expansion-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-major-europe-strengthening-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-south-america-strengthening-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-southeast-asia-strengthening-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-south-asia-strengthening-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-subsaharan-africa-strengthening-official-connectors.postgres.sql', import.meta.url),
    new URL('../db/veygrit-ship-medium-europe-strengthening-official-connectors.postgres.sql', import.meta.url),
  ];
  const sql = (await Promise.all(migrationUrls.map(url => readFile(url, 'utf8')))).join('\n\n');
  const checksum = createHash('sha256').update(sql).digest('hex');
  const { Pool } = await dynamicImport('pg');
  const pool = new Pool({ connectionString, max: 1, application_name: 'veygrit-ship-migration' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT pg_advisory_xact_lock(hashtext('veygrit-ship-core-migration'))`);
    await client.query(sql);
    await client.query('COMMIT');
    process.stdout.write(`Veygrit -ship PostgreSQL migration applied (sha256:${checksum.slice(0, 12)}).\n`);
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* keep original migration failure */ }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
