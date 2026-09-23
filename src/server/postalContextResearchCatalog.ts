import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

export const POSTAL_CONTEXT_RESEARCH_CATALOG_SCHEMA_VERSION =
  'agid-postal-context-research-catalog/v1' as const;
export const DEFAULT_POSTAL_CONTEXT_RESEARCH_CATALOG_PATH = resolve(
  process.cwd(),
  'data/postal-context/research-catalog.json',
);

export type PostalContextResearchEvidence = {
  kind: string;
  path: string;
  declaredDigest: string;
  actualDigest: string | null;
  byteLength: number | null;
  integrity: 'verified' | 'digest_mismatch' | 'missing';
};

export type PostalContextResearchRuntimeArtifact = {
  descriptorPath: string;
  descriptorDigest: string;
  descriptorByteLength: number;
  graphPath: string;
  graphDigest: string;
  graphByteLength: number;
  geometryPath: string;
  geometryDigest: string;
  geometryByteLength: number;
  repositoryId: string;
  releaseId: string;
  policyVersion: string;
  manifestDigest: string;
  maturity: string;
  promotionEligible: boolean;
  synthetic: false;
  containsResidentialAddressPoints: boolean;
  releasedAt: string;
  validFrom: string | null;
  recordCounts: {
    nodes: number;
    assertions: number;
    features: number;
    positions: number;
  };
  sourceTypeCounts: Record<string, number>;
  geometryTypeCounts: Record<string, number>;
  sampleIds: {
    postalContextId: string | null;
    geometryFeatureId: string | null;
    assertionId: string | null;
    linkedContextIds: string[];
  };
};

export type PostalContextResearchCountry = {
  countryCode: string;
  name: string;
  region: string;
  sourceRegion: string;
  status: 'pending' | 'blocked' | 'm2_verified';
  declaredStage: string;
  attempts: number;
  addressFormatPath: string;
  manifestPath: string | null;
  m2Definition: { id: string; definition: string } | null;
  lastAttempt: {
    observedAt: string | null;
    completedAt: string | null;
    result: string | null;
    summary: string | null;
    nextAction: string | null;
  } | null;
  blocker: {
    kind: string | null;
    reason: string | null;
    observedAt: string | null;
    retryAfter: string | null;
    requiresExplicitApproval: boolean;
    unblockCondition: string | null;
  } | null;
  evidence: PostalContextResearchEvidence[];
  runtimeArtifact: PostalContextResearchRuntimeArtifact | null;
};

export type PostalContextResearchCatalog = {
  schemaVersion: typeof POSTAL_CONTEXT_RESEARCH_CATALOG_SCHEMA_VERSION;
  asOf: string;
  sourceBaseCommit: string;
  ledger: { path: string; digest: string; byteLength: number };
  ordering: {
    regionOrder: string[];
    rule: string;
    nextCountry: string | null;
  };
  summary: {
    totalCountries: number;
    statusCounts: Record<string, number>;
    manifests: number;
    explicitM2Definitions: number;
    runtimeArtifacts: number;
    geometryFeatures: number;
    geometryPositions: number;
    evidenceIntegrityCounts: Record<string, number>;
    sourceTypeCounts: Record<string, number>;
    geometryTypeCounts: Record<string, number>;
  };
  sourcePolicy: {
    rawSourceRowsPublished: false;
    postalGeometryMayInferAddressesOrBuildings: false;
    rolloutStatusAndRuntimeAvailabilityAreSeparate: true;
    officialDerivedVirtualClassesPreserved: true;
  };
  countries: PostalContextResearchCountry[];
};

type JsonRecord = Record<string, unknown>;

const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const COUNTRY_CODE = /^[A-Z]{2}$/u;
const UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u;
const MAX_CATALOG_BYTES = 4 * 1024 * 1024;
let defaultCatalogCache: PostalContextResearchCatalog | undefined;

export class PostalContextResearchCatalogError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'PostalContextResearchCatalogError';
  }
}

function fail(code: string): never {
  throw new PostalContextResearchCatalogError(code);
}

function record(value: unknown, code: string): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code);
  return value as JsonRecord;
}

function string(value: unknown, code: string) {
  if (typeof value !== 'string' || !value) fail(code);
  return value;
}

function integer(value: unknown, code: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 0) fail(code);
  return value as number;
}

function repositoryPath(value: unknown, code: string) {
  const path = string(value, code);
  if (isAbsolute(path)
    || path.includes('\\')
    || path.split('/').some(segment => !segment || segment === '.' || segment === '..')) fail(code);
  return path;
}

function digest(value: unknown, code: string) {
  const candidate = string(value, code);
  if (!SHA256.test(candidate)) fail(code);
  return candidate;
}

function instant(value: unknown, code: string) {
  const candidate = string(value, code);
  if (!UTC_INSTANT.test(candidate) || !Number.isFinite(Date.parse(candidate))) fail(code);
  return candidate;
}

function validateRuntimeArtifact(value: unknown, countryCode: string) {
  if (value === null) return;
  const artifact = record(value, 'research-runtime-artifact-invalid');
  repositoryPath(artifact.descriptorPath, 'research-runtime-descriptor-path-invalid');
  repositoryPath(artifact.graphPath, 'research-runtime-graph-path-invalid');
  repositoryPath(artifact.geometryPath, 'research-runtime-geometry-path-invalid');
  digest(artifact.descriptorDigest, 'research-runtime-descriptor-digest-invalid');
  digest(artifact.graphDigest, 'research-runtime-graph-digest-invalid');
  digest(artifact.geometryDigest, 'research-runtime-geometry-digest-invalid');
  digest(artifact.manifestDigest, 'research-runtime-manifest-digest-invalid');
  string(artifact.releaseId, 'research-runtime-release-invalid');
  string(artifact.policyVersion, 'research-runtime-policy-invalid');
  if (artifact.synthetic !== false) fail('research-runtime-must-be-real');
  const counts = record(artifact.recordCounts, 'research-runtime-counts-invalid');
  integer(counts.nodes, 'research-runtime-node-count-invalid');
  integer(counts.assertions, 'research-runtime-assertion-count-invalid');
  if (integer(counts.features, 'research-runtime-feature-count-invalid') < 1) {
    fail('research-runtime-feature-count-invalid');
  }
  if (integer(counts.positions, 'research-runtime-position-count-invalid') < 4) {
    fail('research-runtime-position-count-invalid');
  }
  const expectedPrefix = `data/postal_country_packs/${countryCode.toLowerCase()}/postal-context/m2/`;
  for (const path of [artifact.descriptorPath, artifact.graphPath, artifact.geometryPath]) {
    if (!(path as string).startsWith(expectedPrefix)) fail('research-runtime-country-path-mismatch');
  }
}

export function parsePostalContextResearchCatalog(value: unknown): PostalContextResearchCatalog {
  const catalog = record(value, 'research-catalog-invalid');
  if (catalog.schemaVersion !== POSTAL_CONTEXT_RESEARCH_CATALOG_SCHEMA_VERSION) {
    fail('research-catalog-schema-unsupported');
  }
  instant(catalog.asOf, 'research-catalog-as-of-invalid');
  const ledger = record(catalog.ledger, 'research-catalog-ledger-invalid');
  repositoryPath(ledger.path, 'research-catalog-ledger-path-invalid');
  digest(ledger.digest, 'research-catalog-ledger-digest-invalid');
  integer(ledger.byteLength, 'research-catalog-ledger-length-invalid');
  const summary = record(catalog.summary, 'research-catalog-summary-invalid');
  const countries = Array.isArray(catalog.countries) ? catalog.countries : fail('research-catalog-countries-invalid');
  if (integer(summary.totalCountries, 'research-catalog-total-invalid') !== countries.length) {
    fail('research-catalog-total-mismatch');
  }
  const seen = new Set<string>();
  let runtimeArtifacts = 0;
  for (const item of countries) {
    const country = record(item, 'research-country-invalid');
    const code = string(country.countryCode, 'research-country-code-invalid');
    if (!COUNTRY_CODE.test(code) || seen.has(code)) fail('research-country-code-invalid');
    seen.add(code);
    if (!['pending', 'blocked', 'm2_verified'].includes(String(country.status))) {
      fail('research-country-status-invalid');
    }
    repositoryPath(country.addressFormatPath, 'research-country-address-format-path-invalid');
    if (country.manifestPath !== null) {
      repositoryPath(country.manifestPath, 'research-country-manifest-path-invalid');
    }
    if (!Array.isArray(country.evidence)) fail('research-country-evidence-invalid');
    for (const item of country.evidence) {
      const evidence = record(item, 'research-evidence-invalid');
      repositoryPath(evidence.path, 'research-evidence-path-invalid');
      digest(evidence.declaredDigest, 'research-evidence-declared-digest-invalid');
      if (evidence.actualDigest !== null) digest(evidence.actualDigest, 'research-evidence-actual-digest-invalid');
      if (!['verified', 'digest_mismatch', 'missing'].includes(String(evidence.integrity))) {
        fail('research-evidence-integrity-invalid');
      }
    }
    validateRuntimeArtifact(country.runtimeArtifact, code);
    if (country.runtimeArtifact !== null) runtimeArtifacts += 1;
  }
  if (integer(summary.runtimeArtifacts, 'research-catalog-runtime-count-invalid') !== runtimeArtifacts) {
    fail('research-catalog-runtime-count-mismatch');
  }
  return catalog as unknown as PostalContextResearchCatalog;
}

export function loadPostalContextResearchCatalog(
  path = DEFAULT_POSTAL_CONTEXT_RESEARCH_CATALOG_PATH,
) {
  const absolutePath = resolve(path);
  if (absolutePath === DEFAULT_POSTAL_CONTEXT_RESEARCH_CATALOG_PATH && defaultCatalogCache) {
    return defaultCatalogCache;
  }
  const bytes = readFileSync(absolutePath);
  if (bytes.byteLength > MAX_CATALOG_BYTES) fail('research-catalog-too-large');
  const catalog = parsePostalContextResearchCatalog(JSON.parse(bytes.toString('utf8')));
  if (absolutePath === DEFAULT_POSTAL_CONTEXT_RESEARCH_CATALOG_PATH) defaultCatalogCache = catalog;
  return catalog;
}

export function postalContextResearchCountry(
  catalog: PostalContextResearchCatalog,
  countryCode: string,
) {
  const normalized = countryCode.toUpperCase();
  return catalog.countries.find(country => country.countryCode === normalized);
}
