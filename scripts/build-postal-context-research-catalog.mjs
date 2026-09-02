import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const POSTAL_CONTEXT_RESEARCH_CATALOG_SCHEMA_VERSION =
  'agid-postal-context-research-catalog/v1';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_LEDGER_PATH = resolve(ROOT, 'docs/postal-context-m2-rollout.json');
const DEFAULT_OUTPUT_PATH = resolve(ROOT, 'data/postal-context/research-catalog.json');
const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const COUNTRY_CODE = /^[A-Z]{2}$/u;
const REPORT_FIELDS = [
  ['report', 'reportDigest'],
  ['engineeringReport', 'engineeringReportDigest'],
  ['visualReport', 'visualReportDigest'],
  ['catalogReport', 'catalogReportDigest'],
  ['realObservationReport', 'realObservationReportDigest'],
  ['engineeringChecks', 'engineeringChecksDigest'],
  ['documentation', 'documentationDigest'],
];

function sha256(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function safeRepositoryPath(path) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\\')) return false;
  const absolute = resolve(ROOT, path);
  const fromRoot = relative(ROOT, absolute);
  return fromRoot !== '..'
    && !fromRoot.startsWith(`..${sep}`)
    && !isAbsolute(fromRoot);
}

function verifiedReference(path, digest, kind) {
  if (!safeRepositoryPath(path) || !SHA256.test(digest ?? '')) return undefined;
  const absolute = resolve(ROOT, path);
  if (!existsSync(absolute)) {
    return {
      kind,
      path,
      declaredDigest: digest,
      actualDigest: null,
      byteLength: null,
      integrity: 'missing',
    };
  }
  const bytes = readFileSync(absolute);
  const actualDigest = sha256(bytes);
  return {
    kind,
    path,
    declaredDigest: digest,
    actualDigest,
    byteLength: bytes.byteLength,
    integrity: actualDigest === digest ? 'verified' : 'digest_mismatch',
  };
}

function reportReferences(country) {
  const references = [];
  for (const source of [country.lastAttempt, country.blocker?.evidence]) {
    if (!source || typeof source !== 'object') continue;
    for (const [pathKey, digestKey] of REPORT_FIELDS) {
      const reference = verifiedReference(source[pathKey], source[digestKey], pathKey);
      if (reference && !references.some(item => item.path === reference.path)) references.push(reference);
    }
  }
  return references;
}

function countPositions(value) {
  if (!Array.isArray(value)) return 0;
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') return 1;
  return value.reduce((sum, child) => sum + countPositions(child), 0);
}

function increment(target, key) {
  target[key] = (target[key] ?? 0) + 1;
}

function runtimeArtifact(countryCode) {
  const directory = `data/postal_country_packs/${countryCode.toLowerCase()}/postal-context/m2`;
  const descriptorPath = `${directory}/descriptor.json`;
  const absoluteDescriptorPath = resolve(ROOT, descriptorPath);
  if (!existsSync(absoluteDescriptorPath)) return undefined;

  const descriptorBytes = readFileSync(absoluteDescriptorPath);
  const descriptor = JSON.parse(descriptorBytes.toString('utf8'));
  if (descriptor.countryCode !== countryCode || descriptor.synthetic !== false) {
    throw new Error(`invalid-real-runtime-descriptor:${countryCode}`);
  }
  const byRole = new Map(descriptor.artifacts.map(artifact => [artifact.role, artifact]));
  const graphDescriptor = byRole.get('graph');
  const geometryDescriptor = byRole.get('geometry');
  if (!graphDescriptor || !geometryDescriptor) throw new Error(`missing-runtime-artifact:${countryCode}`);

  const loadArtifact = (artifact, role) => {
    if (typeof artifact.path !== 'string' || artifact.path.includes('/') || artifact.path.includes('\\')) {
      throw new Error(`unsafe-runtime-artifact:${countryCode}:${role}`);
    }
    const path = `${directory}/${artifact.path}`;
    const absolute = resolve(ROOT, path);
    const bytes = readFileSync(absolute);
    if (bytes.byteLength !== artifact.byteLength || sha256(bytes) !== artifact.digest) {
      throw new Error(`runtime-artifact-integrity:${countryCode}:${role}`);
    }
    return { path, bytes, value: JSON.parse(bytes.toString('utf8')) };
  };
  const graph = loadArtifact(graphDescriptor, 'graph');
  const geometry = loadArtifact(geometryDescriptor, 'geometry');
  if (graph.value.release?.countryCode !== countryCode || geometry.value.countryCode !== countryCode) {
    throw new Error(`runtime-country-mismatch:${countryCode}`);
  }
  if (graph.value.nodes.length !== graphDescriptor.recordCounts?.nodes
    || graph.value.assertions.length !== graphDescriptor.recordCounts?.assertions
    || geometry.value.features.length !== geometryDescriptor.recordCounts?.features) {
    throw new Error(`runtime-record-count-mismatch:${countryCode}`);
  }
  const positions = geometry.value.features.reduce(
    (sum, feature) => sum + countPositions(feature.geometry?.coordinates),
    0,
  );
  if (positions !== geometryDescriptor.recordCounts?.positions) {
    throw new Error(`runtime-position-count-mismatch:${countryCode}`);
  }

  const sourceTypeCounts = {};
  const geometryTypeCounts = {};
  for (const feature of geometry.value.features) {
    increment(sourceTypeCounts, feature.source?.sourceType ?? 'unknown');
    increment(geometryTypeCounts, feature.geometry?.type ?? 'unknown');
  }
  const sampleGeometry = geometry.value.features[0];
  const samplePostal = graph.value.nodes.find(node => node.id === sampleGeometry?.nodeId)
    ?? graph.value.nodes.find(node => node.kind === 'postal_feature');
  const sampleAssertion = graph.value.assertions.find(assertion =>
    assertion.fromNodeId === samplePostal?.id || assertion.toNodeId === samplePostal?.id,
  );
  const linkedContextIds = sampleAssertion
    ? [sampleAssertion.fromNodeId, sampleAssertion.toNodeId].filter(id => id !== samplePostal?.id)
    : [];

  return {
    descriptorPath,
    descriptorDigest: sha256(descriptorBytes),
    descriptorByteLength: descriptorBytes.byteLength,
    graphPath: graph.path,
    graphDigest: graphDescriptor.digest,
    graphByteLength: graph.bytes.byteLength,
    geometryPath: geometry.path,
    geometryDigest: geometryDescriptor.digest,
    geometryByteLength: geometry.bytes.byteLength,
    repositoryId: descriptor.repositoryId,
    releaseId: descriptor.releaseId,
    policyVersion: descriptor.policyVersion,
    manifestDigest: descriptor.graphManifestDigest,
    maturity: descriptor.maturity,
    promotionEligible: descriptor.promotionEligible,
    synthetic: descriptor.synthetic,
    containsResidentialAddressPoints: descriptor.containsResidentialAddressPoints,
    releasedAt: graph.value.release.releasedAt,
    validFrom: graph.value.release.validTime?.from ?? null,
    recordCounts: {
      nodes: graph.value.nodes.length,
      assertions: graph.value.assertions.length,
      features: geometry.value.features.length,
      positions,
    },
    sourceTypeCounts,
    geometryTypeCounts,
    sampleIds: {
      postalContextId: samplePostal?.id ?? null,
      geometryFeatureId: sampleGeometry?.id ?? null,
      assertionId: sampleAssertion?.id ?? null,
      linkedContextIds,
    },
  };
}

function lastAttemptSummary(lastAttempt) {
  if (!lastAttempt) return null;
  return {
    observedAt: lastAttempt.observedAt ?? lastAttempt.at ?? lastAttempt.startedAt ?? null,
    completedAt: lastAttempt.completedAt ?? null,
    result: lastAttempt.result ?? lastAttempt.outcome ?? null,
    summary: typeof lastAttempt.summary === 'string' ? lastAttempt.summary : null,
    nextAction: lastAttempt.nextAction ?? null,
  };
}

function blockerSummary(blocker) {
  if (!blocker) return null;
  return {
    kind: blocker.kind ?? blocker.code ?? null,
    reason: blocker.reason ?? null,
    observedAt: blocker.observedAt ?? blocker.checkedAt ?? null,
    retryAfter: blocker.retryAfter ?? null,
    requiresExplicitApproval: blocker.requiresExplicitApproval ?? false,
    unblockCondition: blocker.unblockCondition ?? blocker.unblockWhen ?? null,
  };
}

function latestInstant(countries) {
  return countries
    .flatMap(country => [
      country.lastAttempt?.completedAt,
      country.lastAttempt?.observedAt,
      country.lastAttempt?.at,
      country.lastAttempt?.startedAt,
      country.blocker?.observedAt,
      country.blocker?.checkedAt,
    ])
    .filter(value => typeof value === 'string' && Number.isFinite(Date.parse(value)))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

export function buildPostalContextResearchCatalog(options = {}) {
  const ledgerPath = resolve(options.ledgerPath ?? DEFAULT_LEDGER_PATH);
  const ledgerBytes = readFileSync(ledgerPath);
  const ledger = JSON.parse(ledgerBytes.toString('utf8'));
  if (!Array.isArray(ledger.countries) || ledger.countries.some(country => !COUNTRY_CODE.test(country.countryCode))) {
    throw new Error('invalid-postal-context-rollout-ledger');
  }

  const runtimeArtifacts = [];
  const countries = ledger.countries.map(country => {
    const artifact = runtimeArtifact(country.countryCode);
    if (artifact) runtimeArtifacts.push(artifact);
    return {
      countryCode: country.countryCode,
      name: country.name,
      region: country.region,
      sourceRegion: country.sourceRegion,
      status: country.status,
      declaredStage: country.declaredStage,
      attempts: country.attempts,
      addressFormatPath: country.addressFormat,
      manifestPath: country.manifest ?? null,
      m2Definition: country.m2Definition?.id
        ? { id: country.m2Definition.id, definition: country.m2Definition.definition }
        : null,
      lastAttempt: lastAttemptSummary(country.lastAttempt),
      blocker: blockerSummary(country.blocker),
      evidence: reportReferences(country),
      runtimeArtifact: artifact ?? null,
    };
  });

  const statusCounts = {};
  for (const country of countries) increment(statusCounts, country.status);
  const evidenceIntegrityCounts = {};
  for (const evidence of countries.flatMap(country => country.evidence)) {
    increment(evidenceIntegrityCounts, evidence.integrity);
  }
  const sourceTypeCounts = {};
  const geometryTypeCounts = {};
  for (const artifact of runtimeArtifacts) {
    for (const [key, value] of Object.entries(artifact.sourceTypeCounts)) {
      sourceTypeCounts[key] = (sourceTypeCounts[key] ?? 0) + value;
    }
    for (const [key, value] of Object.entries(artifact.geometryTypeCounts)) {
      geometryTypeCounts[key] = (geometryTypeCounts[key] ?? 0) + value;
    }
  }

  const catalog = {
    schemaVersion: POSTAL_CONTEXT_RESEARCH_CATALOG_SCHEMA_VERSION,
    asOf: latestInstant(ledger.countries),
    sourceBaseCommit: ledger.sourceBaseCommit,
    ledger: {
      path: relative(ROOT, ledgerPath).replaceAll('\\', '/'),
      digest: sha256(ledgerBytes),
      byteLength: ledgerBytes.byteLength,
    },
    ordering: {
      regionOrder: ledger.regionOrder,
      rule: ledger.ordering,
      nextCountry: countries.find(country => country.status === 'pending')?.countryCode ?? null,
    },
    summary: {
      totalCountries: countries.length,
      statusCounts,
      manifests: countries.filter(country => country.manifestPath).length,
      explicitM2Definitions: countries.filter(country => country.m2Definition).length,
      runtimeArtifacts: runtimeArtifacts.length,
      geometryFeatures: runtimeArtifacts.reduce((sum, item) => sum + item.recordCounts.features, 0),
      geometryPositions: runtimeArtifacts.reduce((sum, item) => sum + item.recordCounts.positions, 0),
      evidenceIntegrityCounts,
      sourceTypeCounts,
      geometryTypeCounts,
    },
    sourcePolicy: {
      rawSourceRowsPublished: false,
      postalGeometryMayInferAddressesOrBuildings: false,
      rolloutStatusAndRuntimeAvailabilityAreSeparate: true,
      officialDerivedVirtualClassesPreserved: true,
    },
    countries,
  };
  return catalog;
}

export function writePostalContextResearchCatalog(outputPath = DEFAULT_OUTPUT_PATH) {
  const catalog = buildPostalContextResearchCatalog();
  const bytes = `${JSON.stringify(catalog, null, 2)}\n`;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, bytes);
  return { catalog, outputPath, digest: sha256(bytes), byteLength: Buffer.byteLength(bytes) };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = writePostalContextResearchCatalog(
    process.argv[2] ? resolve(process.argv[2]) : DEFAULT_OUTPUT_PATH,
  );
  console.log(JSON.stringify({
    outputPath: relative(ROOT, result.outputPath).replaceAll('\\', '/'),
    digest: result.digest,
    byteLength: result.byteLength,
    countries: result.catalog.summary.totalCountries,
    runtimeArtifacts: result.catalog.summary.runtimeArtifacts,
    geometryFeatures: result.catalog.summary.geometryFeatures,
  }));
}
