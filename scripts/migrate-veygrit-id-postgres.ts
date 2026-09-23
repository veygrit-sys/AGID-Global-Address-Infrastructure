import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const databaseUrl = process.env.VEYGRIT_ID_DATABASE_URL;
if (!databaseUrl) throw new Error('VEYGRIT_ID_DATABASE_URL is required.');

const sql = await readFile(path.resolve('db/veygrit-id-core.postgres.sql'), 'utf8');
const pool = new pg.Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined, max: 1 });
try {
  await pool.query(sql);
  process.stdout.write('Veygrit ID PostgreSQL migration completed.\n');
} finally {
  await pool.end();
}
