export type DatabaseProductionAdapter = 'postgres' | 'redis' | 'mongodb' | 'sqlite' | 'file' | 'memory' | string;

export type DatabaseProductionGuardInput = {
  adapter: DatabaseProductionAdapter;
  url?: string;
  serviceName: string;
  envPrefix?: string;
  env?: NodeJS.ProcessEnv;
};

export type DatabaseProductionGuardResult = {
  ok: boolean;
  strict: boolean;
  errors: string[];
  warnings: string[];
};

const PRIVILEGED_USERS = new Set(['postgres', 'root', 'admin', 'administrator', 'default', 'sa']);

function envFlag(env: NodeJS.ProcessEnv, key: string) {
  return /^(1|true|yes|y|on)$/i.test(String(env[key] ?? '').trim());
}

function firstConfiguredFlag(env: NodeJS.ProcessEnv, keys: string[]) {
  return keys.some(key => envFlag(env, key));
}

function parseUrl(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function usernameFrom(url: URL | null) {
  return decodeURIComponent(url?.username ?? '').trim().toLowerCase();
}

function hasPostgresTls(url: URL | null) {
  const sslmode = url?.searchParams.get('sslmode')?.toLowerCase();
  return sslmode === 'require' || sslmode === 'verify-ca' || sslmode === 'verify-full'
    || /^(1|true|yes)$/i.test(url?.searchParams.get('ssl') ?? '');
}

function hasRedisTls(url: URL | null) {
  return url?.protocol === 'rediss:' || /^(1|true|yes)$/i.test(url?.searchParams.get('tls') ?? '');
}

function hasMongoTls(url: URL | null) {
  return url?.protocol === 'mongodb+srv:'
    || /^(1|true|yes)$/i.test(url?.searchParams.get('tls') ?? url?.searchParams.get('ssl') ?? '');
}

function addCredentialFindings(adapter: string, url: URL | null, errors: string[], warnings: string[], serviceName: string) {
  const username = usernameFrom(url);
  if (!username) {
    if (adapter === 'redis') {
      warnings.push(`${serviceName}: Redis URL has no username; verify ACL user separation before production.`);
      return;
    }
    errors.push(`${serviceName}: database URL must use a non-privileged application user.`);
    return;
  }
  if (PRIVILEGED_USERS.has(username)) {
    errors.push(`${serviceName}: database URL uses privileged user "${username}". Use a least-privilege application role.`);
  }
}

export function evaluateDatabaseProductionGuard(input: DatabaseProductionGuardInput): DatabaseProductionGuardResult {
  const env = input.env ?? process.env;
  const adapter = String(input.adapter || '').trim().toLowerCase();
  const strict = env.NODE_ENV === 'production' || String(env.AGID_DB_PRODUCTION_GUARD ?? '').toLowerCase() === 'strict';
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!strict) return { ok: true, strict, errors, warnings };

  if (adapter === 'memory' || adapter === 'file' || adapter === 'sqlite') {
    warnings.push(`${input.serviceName}: ${adapter} storage is local-only; use managed backups and filesystem permissions before production.`);
    return { ok: true, strict, errors, warnings };
  }

  const url = parseUrl(input.url);
  if (!url) {
    errors.push(`${input.serviceName}: database URL is missing or invalid.`);
  }

  if (adapter === 'postgres' && !hasPostgresTls(url)) {
    errors.push(`${input.serviceName}: Postgres production URL must enable TLS with sslmode=require, verify-ca, or verify-full.`);
  }
  if (adapter === 'redis' && !hasRedisTls(url)) {
    errors.push(`${input.serviceName}: Redis production URL must use rediss:// or tls=true.`);
  }
  if (adapter === 'mongodb' && !hasMongoTls(url)) {
    errors.push(`${input.serviceName}: MongoDB production URL must use mongodb+srv://, tls=true, or ssl=true.`);
  }

  addCredentialFindings(adapter, url, errors, warnings, input.serviceName);

  const prefix = input.envPrefix?.trim();
  const migrationFlags = [
    ...(prefix ? [`${prefix}_MIGRATIONS_APPLIED`] : []),
    'AGID_DB_MIGRATIONS_APPLIED',
  ];
  if (!firstConfiguredFlag(env, migrationFlags)) {
    errors.push(`${input.serviceName}: production migrations must be marked applied with ${migrationFlags.join(' or ')}.`);
  }

  const auditFlags = [
    ...(prefix ? [`${prefix}_AUDIT_LOG_ENABLED`] : []),
    'AGID_DB_AUDIT_LOG_ENABLED',
  ];
  if (!firstConfiguredFlag(env, auditFlags)) {
    errors.push(`${input.serviceName}: production audit logging must be enabled with ${auditFlags.join(' or ')}.`);
  }

  return { ok: errors.length === 0, strict, errors, warnings };
}

export function assertDatabaseProductionReady(input: DatabaseProductionGuardInput) {
  const result = evaluateDatabaseProductionGuard(input);
  if (!result.ok) {
    throw new Error(result.errors.join(' '));
  }
  return result;
}
