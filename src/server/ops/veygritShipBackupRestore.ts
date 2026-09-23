export type DatabaseTarget = {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

export function parseDatabaseTarget(connectionString: string): DatabaseTarget {
  const url = new URL(connectionString);
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') throw new TypeError('Only PostgreSQL connection URLs are accepted.');
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!url.hostname || !database) throw new TypeError('PostgreSQL host and database are required.');
  return {
    host: url.hostname,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

export function assertSafeRestoreDrill(sourceUrl: string, targetUrl: string, confirmation: string): { source: DatabaseTarget; target: DatabaseTarget } {
  if (confirmation !== 'RESTORE_DRILL_ONLY') throw new Error('Set VEYGRIT_SHIP_RESTORE_DRILL_CONFIRM=RESTORE_DRILL_ONLY.');
  const source = parseDatabaseTarget(sourceUrl);
  const target = parseDatabaseTarget(targetUrl);
  if (sourceUrl === targetUrl || (source.host === target.host && source.port === target.port && source.database === target.database)) {
    throw new Error('Source and restore-drill target must be different databases.');
  }
  if (!/(restore[_-]?drill|dr[_-]?test|disaster[_-]?recovery)/i.test(target.database)) {
    throw new Error('Restore target database name must contain restore_drill, dr_test, or disaster_recovery.');
  }
  if (/prod(uction)?/i.test(target.database)) throw new Error('A production-named target is forbidden.');
  return { source, target };
}

export function postgresClientEnvironment(target: DatabaseTarget): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PGHOST: target.host,
    PGPORT: target.port,
    PGUSER: target.user,
    PGPASSWORD: target.password,
    PGDATABASE: target.database,
  };
}
