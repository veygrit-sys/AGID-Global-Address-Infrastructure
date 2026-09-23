export const POSTAL_SOURCE_READINESS_ADAPTER_VERSION = 'postal-source-readiness-adapter-v1';

export type PostalSourceReadinessDialect = 'sqlite' | 'postgres';

// This DTO is the only projection accepted by the verification engine.
// It intentionally excludes source URLs, addresses, lookup payloads, and credentials.
export type PostalSourceValidationReadinessEvidence = {
  sourceId: string;
  officialReferenceValidationEligible: boolean;
  deliveryClaimsEnabled: false;
};

export type PostalSourceReadinessQuery = {
  dialect: PostalSourceReadinessDialect;
  statement: string;
  parameters: readonly [string];
};

export type PostalSourceReadinessRow = Readonly<Record<string, unknown>>;

export type PostalSourceReadinessQueryExecutor = {
  all: (statement: string, parameters: readonly string[]) => readonly PostalSourceReadinessRow[];
};

const SOURCE_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/;

function countryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new Error('postal source readiness requires an ISO 3166-1 alpha-2 country code');
  }
  return normalized;
}

function sourceId(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return SOURCE_ID_PATTERN.test(normalized) ? normalized : null;
}

function isDatabaseTrue(value: unknown) {
  return value === true || value === 1;
}

function isDatabaseFalse(value: unknown) {
  return value === false || value === 0;
}

export function buildPostalSourceReadinessQuery(
  country: string,
  dialect: PostalSourceReadinessDialect,
): PostalSourceReadinessQuery {
  const placeholder = dialect === 'postgres' ? '$1' : '?';
  return {
    dialect,
    statement: `SELECT source_id, official_reference_validation_eligible, delivery_claims_enabled
FROM postal_source_validation_readiness
WHERE country_code = ${placeholder}
ORDER BY source_id ASC`,
    parameters: [countryCode(country)],
  };
}

export function projectPostalSourceValidationReadiness(
  rows: readonly PostalSourceReadinessRow[],
): PostalSourceValidationReadinessEvidence[] {
  const eligibilityBySourceId = new Map<string, boolean>();

  for (const row of rows) {
    const id = sourceId(row.source_id);
    if (!id) continue;

    // Both drivers expose booleans differently. Any uncertain value blocks the source.
    const eligible = isDatabaseTrue(row.official_reference_validation_eligible)
      && isDatabaseFalse(row.delivery_claims_enabled);
    const previous = eligibilityBySourceId.get(id);
    eligibilityBySourceId.set(id, previous === undefined ? eligible : previous && eligible);
  }

  return [...eligibilityBySourceId.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([sourceId, officialReferenceValidationEligible]) => ({
      sourceId,
      officialReferenceValidationEligible,
      deliveryClaimsEnabled: false,
    }));
}

export function loadPostalSourceValidationReadiness(
  executor: PostalSourceReadinessQueryExecutor,
  country: string,
  dialect: PostalSourceReadinessDialect,
): PostalSourceValidationReadinessEvidence[] {
  const query = buildPostalSourceReadinessQuery(country, dialect);
  return projectPostalSourceValidationReadiness(executor.all(query.statement, query.parameters));
}
