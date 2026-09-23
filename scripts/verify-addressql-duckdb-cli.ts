import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

type SmokeReport = {
  status: 'ok' | 'skipped' | 'failed';
  adapter: 'addressql-duckdb';
  smokeSql: string;
  duckdbBinary: string;
  duckdbVersion?: string;
  requiredCli: boolean;
  reason?: string;
};

const repoRoot = process.cwd();
const smokeSql = 'extensions/addressql-duckdb/test/addressql_duckdb_smoke.sql';
const smokeSqlPath = resolve(repoRoot, smokeSql);
const duckdbBinary = process.env.ADDRESSQL_DUCKDB_CLI ?? 'duckdb';
const requiredCli =
  process.argv.includes('--require-cli') ||
  process.env.ADDRESSQL_DUCKDB_REQUIRE_CLI === '1';

function printReport(report: SmokeReport) {
  console.log(JSON.stringify(report, null, 2));
}

function fail(report: SmokeReport, stderr?: string, stdout?: string): never {
  printReport(report);
  if (stdout?.trim()) console.log(stdout);
  if (stderr?.trim()) console.error(stderr);
  process.exit(1);
}

if (!existsSync(smokeSqlPath)) {
  fail({
    status: 'failed',
    adapter: 'addressql-duckdb',
    smokeSql,
    duckdbBinary,
    requiredCli,
    reason: 'smoke-sql-not-found',
  });
}

const version = spawnSync(duckdbBinary, ['--version'], {
  cwd: repoRoot,
  encoding: 'utf8',
  shell: false,
});

if (version.error || version.status !== 0) {
  const report: SmokeReport = {
    status: requiredCli ? 'failed' : 'skipped',
    adapter: 'addressql-duckdb',
    smokeSql,
    duckdbBinary,
    requiredCli,
    reason: 'duckdb-cli-not-found',
  };

  if (requiredCli) fail(report, version.stderr, version.stdout);
  printReport(report);
  process.exit(0);
}

const sql = readFileSync(smokeSqlPath, 'utf8');
const run = spawnSync(duckdbBinary, [':memory:'], {
  cwd: repoRoot,
  input: sql,
  encoding: 'utf8',
  shell: false,
  maxBuffer: 1024 * 1024 * 8,
});

if (run.error || run.status !== 0) {
  fail(
    {
      status: 'failed',
      adapter: 'addressql-duckdb',
      smokeSql,
      duckdbBinary,
      duckdbVersion: version.stdout.trim() || version.stderr.trim(),
      requiredCli,
      reason: run.error?.message ?? `duckdb-exit-${run.status}`,
    },
    run.stderr,
    run.stdout,
  );
}

const stdout = run.stdout.trim();
for (const expected of [
  'has_country_profiles',
  'resolves_japan',
  'duckdb_postal_validate_v0_1_shape',
  'duckdb_postal_validate_json_shape',
  'rejects_hk_fake_postal_code',
  'country_code',
]) {
  if (!stdout.includes(expected)) {
    fail(
      {
        status: 'failed',
        adapter: 'addressql-duckdb',
        smokeSql,
        duckdbBinary,
        duckdbVersion: version.stdout.trim() || version.stderr.trim(),
        requiredCli,
        reason: `missing-expected-output:${expected}`,
      },
      run.stderr,
      run.stdout,
    );
  }
}

printReport({
  status: 'ok',
  adapter: 'addressql-duckdb',
  smokeSql,
  duckdbBinary,
  duckdbVersion: version.stdout.trim() || version.stderr.trim(),
  requiredCli,
});
