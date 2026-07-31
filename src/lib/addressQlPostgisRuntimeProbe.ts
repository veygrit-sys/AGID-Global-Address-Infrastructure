export const ADDRESSQL_POSTGIS_RUNTIME_PREFLIGHT_VERSION =
  'addressql-postgis-runtime-preflight-v1';

export type AddressQlPostgisQuery = (
  sql: string,
) => Promise<{ rows: readonly Record<string, unknown>[] }>;

export type AddressQlPostgisRuntimePreflight = {
  version: typeof ADDRESSQL_POSTGIS_RUNTIME_PREFLIGHT_VERSION;
  status: 'available' | 'missing' | 'blocked';
  extension: 'postgis';
  extensionVersion?: string;
  reason?: 'postgis-extension-not-installed' | 'postgis-version-invalid' | 'postgis-query-failed';
  dataAccess: 'extension-metadata-only';
  containsAddressMaterial: false;
};

const POSTGIS_EXTENSION_QUERY = `
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'postgis'
LIMIT 1
`.trim();

const POSTGIS_VERSION = /^\d+\.\d+(?:\.\d+)?(?:[._+-][0-9A-Za-z.-]+)?$/;

/**
 * Verifies only PostgreSQL extension metadata through a caller-owned query
 * adapter. It never receives a DSN, reads application tables, or sends any
 * address data to PostgreSQL.
 */
export async function probeAddressQlPostgisRuntime(
  query: AddressQlPostgisQuery,
): Promise<AddressQlPostgisRuntimePreflight> {
  try {
    const result = await query(POSTGIS_EXTENSION_QUERY);
    const row = result.rows[0];
    if (!row) {
      return {
        version: ADDRESSQL_POSTGIS_RUNTIME_PREFLIGHT_VERSION,
        status: 'missing',
        extension: 'postgis',
        reason: 'postgis-extension-not-installed',
        dataAccess: 'extension-metadata-only',
        containsAddressMaterial: false,
      };
    }
    const extensionVersion = typeof row.extversion === 'string' ? row.extversion.trim() : '';
    if (!POSTGIS_VERSION.test(extensionVersion)) {
      return {
        version: ADDRESSQL_POSTGIS_RUNTIME_PREFLIGHT_VERSION,
        status: 'blocked',
        extension: 'postgis',
        reason: 'postgis-version-invalid',
        dataAccess: 'extension-metadata-only',
        containsAddressMaterial: false,
      };
    }
    return {
      version: ADDRESSQL_POSTGIS_RUNTIME_PREFLIGHT_VERSION,
      status: 'available',
      extension: 'postgis',
      extensionVersion,
      dataAccess: 'extension-metadata-only',
      containsAddressMaterial: false,
    };
  } catch {
    return {
      version: ADDRESSQL_POSTGIS_RUNTIME_PREFLIGHT_VERSION,
      status: 'blocked',
      extension: 'postgis',
      reason: 'postgis-query-failed',
      dataAccess: 'extension-metadata-only',
      containsAddressMaterial: false,
    };
  }
}

export function addressQlPostgisRuntimePreflightQuery() {
  return POSTGIS_EXTENSION_QUERY;
}
