import { createHash } from 'node:crypto';
import {
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';

import {
  POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
  type PostalContextRepositoryReleaseManifest,
} from '../lib/postalContextGraph';
import { parsePostalContextRuntimePack } from '../lib/postalContextPackParser';
import {
  POSTAL_CONTEXT_RUNTIME_PACK_SCHEMA_VERSION,
  PostalContextPackRuntime,
  type PostalContextRuntimeAttestation,
  type PostalContextRuntimeMaturity,
} from '../lib/postalContextPackRuntime';
import { POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION } from '../lib/postalContextSpatial';
import { POSTAL_CONTEXT_PACK_LIMITS } from '../lib/postalContextTopology';

export const POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION =
  'postal-context-pack-descriptor/v0.1' as const;

export type PostalContextPackArtifactDescriptor = {
  role: 'graph' | 'geometry';
  path: string;
  mediaType: string;
  schemaVersion: string;
  byteLength: number;
  digest: string;
  recordCounts: {
    nodes?: number;
    assertions?: number;
    features?: number;
    positions?: number;
  };
};

export type PostalContextPackDescriptor = {
  schemaVersion: typeof POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION;
  repositoryId: string;
  countryCode: string;
  releaseId: string;
  policyVersion: string;
  sequence: number;
  previousDescriptorDigest: string | null;
  graphManifestDigest: string;
  createdAt: string;
  maturity: PostalContextRuntimeMaturity;
  synthetic: boolean;
  promotionEligible: boolean;
  containsResidentialAddressPoints: boolean;
  artifacts: readonly PostalContextPackArtifactDescriptor[];
};

export type PostalContextLoadedPack = {
  runtime: PostalContextPackRuntime;
  descriptor: PostalContextPackDescriptor;
  descriptorDigest: string;
  warnings: string[];
};

export type PostalContextPackLoadOptions = {
  expectedCountryCode: string;
  allowExperimental?: boolean;
  allowSynthetic?: boolean;
};

export type PostalContextPackStoreCountryStatus = {
  countryCode: string;
  state: 'unconfigured' | 'ready' | 'degraded_lkg' | 'invalid';
  runtime?: ReturnType<PostalContextPackRuntime['status']>;
  errors: string[];
  warnings: string[];
};

export type PostalContextPackStore = {
  getRuntime(countryCode: string): PostalContextPackRuntime | undefined;
  countryStatus(countryCode: string): PostalContextPackStoreCountryStatus;
  statuses(): PostalContextPackStoreCountryStatus[];
};

type JsonRecord = Record<string, unknown>;

const SHA256 = /^sha256:[a-f0-9]{64}$/;
const UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const SAFE_BASENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const WINDOWS_DEVICE = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i;
const DESCRIPTOR_MAX_BYTES = 256 * 1024;

const DESCRIPTOR_KEYS = new Set([
  'schemaVersion',
  'repositoryId',
  'countryCode',
  'releaseId',
  'policyVersion',
  'sequence',
  'previousDescriptorDigest',
  'graphManifestDigest',
  'createdAt',
  'maturity',
  'synthetic',
  'promotionEligible',
  'containsResidentialAddressPoints',
  'artifacts',
]);
const ARTIFACT_KEYS = new Set([
  'role',
  'path',
  'mediaType',
  'schemaVersion',
  'byteLength',
  'digest',
  'recordCounts',
]);
const RECORD_COUNT_KEYS = new Set(['nodes', 'assertions', 'features', 'positions']);

export class PostalContextPackLoadError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'PostalContextPackLoadError';
  }
}

function fail(code: string): never {
  throw new PostalContextPackLoadError(code);
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sha256(bytes: Uint8Array | string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function exactUtcInstant(value: unknown) {
  return typeof value === 'string'
    && UTC_INSTANT.test(value)
    && Number.isFinite(Date.parse(value));
}

function assertKnownKeys(record: JsonRecord, allowed: Set<string>, code: string) {
  if (Object.keys(record).some(key => !allowed.has(key))) fail(code);
}

function safeArtifactBasename(value: unknown) {
  if (typeof value !== 'string'
    || !SAFE_BASENAME.test(value)
    || basename(value) !== value
    || value === '.'
    || value === '..'
    || value.includes(':')
    || value.includes('%')
    || /[. ]$/.test(value)
    || WINDOWS_DEVICE.test(value)) fail('unsafe-artifact-path');
  return value;
}

function readBoundedRegularFile(
  path: string,
  maximumBytes: number,
  rootDirectory?: string,
) {
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile()) fail('pack-file-not-regular');
    if (stat.size < 1 || stat.size > maximumBytes) fail('pack-file-size-limit');
    const realPath = realpathSync(path);
    if (rootDirectory) {
      const rel = relative(rootDirectory, realPath);
      if (!rel || rel.startsWith('..') || isAbsolute(rel)) fail('artifact-path-escaped-root');
    }
    const descriptor = openSync(realPath, 'r');
    try {
      const before = fstatSync(descriptor);
      if (!before.isFile() || before.size !== stat.size) fail('pack-file-changed-before-read');
      const bytes = readFileSync(descriptor);
      const after = fstatSync(descriptor);
      if (after.size !== before.size || bytes.byteLength !== before.size) fail('pack-file-changed-during-read');
      return { bytes, realPath };
    } finally {
      closeSync(descriptor);
    }
  } catch (error) {
    if (error instanceof PostalContextPackLoadError) throw error;
    fail('pack-file-read-failed');
  }
}

function strictUtf8(bytes: Uint8Array) {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    fail('pack-invalid-utf8');
  }
  if (text.charCodeAt(0) === 0xfeff) fail('pack-bom-forbidden');
  if (text.includes('\u0000')) fail('pack-nul-forbidden');
  return text;
}

function assertNoDuplicateJsonKeys(text: string) {
  let index = 0;
  const whitespace = /\s/;
  const skipWhitespace = () => {
    while (index < text.length && whitespace.test(text[index])) index += 1;
  };
  const parseString = () => {
    if (text[index] !== '"') fail('pack-invalid-json');
    const start = index;
    index += 1;
    while (index < text.length) {
      if (text[index] === '\\') {
        index += 2;
        continue;
      }
      if (text[index] === '"') {
        index += 1;
        try {
          return JSON.parse(text.slice(start, index)) as string;
        } catch {
          fail('pack-invalid-json');
        }
      }
      if (text.charCodeAt(index) < 0x20) fail('pack-invalid-json');
      index += 1;
    }
    fail('pack-invalid-json');
  };
  const parseValue = (): void => {
    skipWhitespace();
    const token = text[index];
    if (token === '{') {
      index += 1;
      skipWhitespace();
      const keys = new Set<string>();
      if (text[index] === '}') {
        index += 1;
        return;
      }
      while (index < text.length) {
        skipWhitespace();
        const key = parseString();
        if (keys.has(key)) fail('pack-duplicate-json-key');
        keys.add(key);
        skipWhitespace();
        if (text[index] !== ':') fail('pack-invalid-json');
        index += 1;
        parseValue();
        skipWhitespace();
        if (text[index] === '}') {
          index += 1;
          return;
        }
        if (text[index] !== ',') fail('pack-invalid-json');
        index += 1;
      }
      fail('pack-invalid-json');
    }
    if (token === '[') {
      index += 1;
      skipWhitespace();
      if (text[index] === ']') {
        index += 1;
        return;
      }
      while (index < text.length) {
        parseValue();
        skipWhitespace();
        if (text[index] === ']') {
          index += 1;
          return;
        }
        if (text[index] !== ',') fail('pack-invalid-json');
        index += 1;
      }
      fail('pack-invalid-json');
    }
    if (token === '"') {
      parseString();
      return;
    }
    const rest = text.slice(index);
    const primitive = /^(?:-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(rest)?.[0];
    if (!primitive) fail('pack-invalid-json');
    index += primitive.length;
  };
  parseValue();
  skipWhitespace();
  if (index !== text.length) fail('pack-invalid-json');
}

function parseStrictJson(bytes: Uint8Array) {
  const text = strictUtf8(bytes);
  assertNoDuplicateJsonKeys(text);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    fail('pack-invalid-json');
  }
}

function requireString(value: unknown, code: string, pattern?: RegExp) {
  if (typeof value !== 'string' || !value || value.length > 2048 || (pattern && !pattern.test(value))) {
    fail(code);
  }
  return value;
}

function requireCount(value: unknown, maximum: number, code: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > maximum) fail(code);
  return value as number;
}

function parseArtifact(value: unknown): PostalContextPackArtifactDescriptor {
  if (!isRecord(value)) fail('descriptor-artifact-invalid');
  assertKnownKeys(value, ARTIFACT_KEYS, 'descriptor-artifact-unknown-field');
  if (value.role !== 'graph' && value.role !== 'geometry') fail('descriptor-artifact-role-invalid');
  const recordCounts = value.recordCounts;
  if (!isRecord(recordCounts)) fail('descriptor-record-counts-invalid');
  assertKnownKeys(recordCounts, RECORD_COUNT_KEYS, 'descriptor-record-counts-unknown-field');
  const parsedCounts = {
    nodes: recordCounts.nodes === undefined
      ? undefined
      : requireCount(recordCounts.nodes, POSTAL_CONTEXT_PACK_LIMITS.nodes, 'descriptor-node-count-invalid'),
    assertions: recordCounts.assertions === undefined
      ? undefined
      : requireCount(
          recordCounts.assertions,
          POSTAL_CONTEXT_PACK_LIMITS.assertions,
          'descriptor-assertion-count-invalid',
        ),
    features: recordCounts.features === undefined
      ? undefined
      : requireCount(recordCounts.features, POSTAL_CONTEXT_PACK_LIMITS.features, 'descriptor-feature-count-invalid'),
    positions: recordCounts.positions === undefined
      ? undefined
      : requireCount(recordCounts.positions, POSTAL_CONTEXT_PACK_LIMITS.positions, 'descriptor-position-count-invalid'),
  };
  const byteMaximum = value.role === 'graph'
    ? POSTAL_CONTEXT_PACK_LIMITS.graphBytes
    : POSTAL_CONTEXT_PACK_LIMITS.geometryBytes;
  return {
    role: value.role,
    path: safeArtifactBasename(value.path),
    mediaType: requireString(value.mediaType, 'descriptor-media-type-invalid'),
    schemaVersion: requireString(value.schemaVersion, 'descriptor-artifact-schema-invalid'),
    byteLength: requireCount(value.byteLength, byteMaximum, 'descriptor-byte-length-invalid'),
    digest: requireString(value.digest, 'descriptor-artifact-digest-invalid', SHA256),
    recordCounts: parsedCounts,
  };
}

function parseDescriptor(value: unknown): PostalContextPackDescriptor {
  if (!isRecord(value)) fail('descriptor-object-required');
  assertKnownKeys(value, DESCRIPTOR_KEYS, 'descriptor-unknown-field');
  if (value.schemaVersion !== POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION) {
    fail('descriptor-schema-unsupported');
  }
  if (!Number.isSafeInteger(value.sequence) || (value.sequence as number) < 1) fail('descriptor-sequence-invalid');
  if (value.previousDescriptorDigest !== null
    && (typeof value.previousDescriptorDigest !== 'string'
      || !SHA256.test(value.previousDescriptorDigest))) fail('descriptor-previous-digest-invalid');
  if (value.sequence === 1 && value.previousDescriptorDigest !== null) fail('descriptor-first-release-has-predecessor');
  if ((value.sequence as number) > 1 && value.previousDescriptorDigest === null) fail('descriptor-predecessor-required');
  if (!exactUtcInstant(value.createdAt)) fail('descriptor-created-at-invalid');
  if (!['M2_experimental', 'M3_candidate', 'M4_stable'].includes(String(value.maturity))) {
    fail('descriptor-maturity-invalid');
  }
  if (typeof value.synthetic !== 'boolean'
    || typeof value.promotionEligible !== 'boolean'
    || typeof value.containsResidentialAddressPoints !== 'boolean') fail('descriptor-policy-flags-invalid');
  if (value.containsResidentialAddressPoints) fail('public-pack-residential-address-points-forbidden');
  if (value.synthetic
    && (value.maturity !== 'M2_experimental' || value.promotionEligible)) {
    fail('synthetic-promotion-policy-invalid');
  }
  if (!Array.isArray(value.artifacts) || value.artifacts.length !== 2) fail('descriptor-artifact-count-invalid');
  const artifacts = value.artifacts.map(parseArtifact);
  if (new Set(artifacts.map(artifact => artifact.role)).size !== 2) fail('descriptor-artifact-role-duplicate');
  if (new Set(artifacts.map(artifact => artifact.path.toLowerCase())).size !== 2) {
    fail('descriptor-artifact-path-collision');
  }
  return {
    schemaVersion: POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION,
    repositoryId: requireString(value.repositoryId, 'descriptor-repository-invalid'),
    countryCode: requireString(value.countryCode, 'descriptor-country-invalid', /^[A-Z]{2}$/),
    releaseId: requireString(value.releaseId, 'descriptor-release-invalid'),
    policyVersion: requireString(value.policyVersion, 'descriptor-policy-invalid'),
    sequence: value.sequence as number,
    previousDescriptorDigest: value.previousDescriptorDigest as string | null,
    graphManifestDigest: requireString(value.graphManifestDigest, 'descriptor-graph-manifest-invalid', SHA256),
    createdAt: value.createdAt as string,
    maturity: value.maturity as PostalContextRuntimeMaturity,
    synthetic: value.synthetic,
    promotionEligible: value.promotionEligible,
    containsResidentialAddressPoints: value.containsResidentialAddressPoints,
    artifacts,
  };
}

function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('graph-manifest-canonicalization-invalid');
    return JSON.stringify(value);
  }
  if (typeof value !== 'object') fail('graph-manifest-canonicalization-invalid');
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as JsonRecord;
  if (Object.keys(record).some(key => record[key] === undefined)) {
    fail('graph-manifest-canonicalization-invalid');
  }
  return `{${Object.keys(record).sort().map(key =>
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}

export function computePostalContextGraphManifestDigest(
  manifest: PostalContextRepositoryReleaseManifest,
) {
  const { manifestDigest: _manifestDigest, ...payload } = manifest;
  return sha256(canonicalJson(payload));
}

function crossValidateDescriptor(
  descriptor: PostalContextPackDescriptor,
  descriptorDigest: string,
  artifacts: Map<'graph' | 'geometry', { descriptor: PostalContextPackArtifactDescriptor; value: unknown }>,
  expectedCountryCode: string,
) {
  const graphValue = artifacts.get('graph')?.value;
  const geometryValue = artifacts.get('geometry')?.value;
  const parsed = parsePostalContextRuntimePack({
    schemaVersion: POSTAL_CONTEXT_RUNTIME_PACK_SCHEMA_VERSION,
    graph: graphValue,
    geometry: geometryValue,
  }, expectedCountryCode);
  if (!parsed.ok || !parsed.pack || !parsed.counts) fail('runtime-pack-validation-failed');
  const { graph, geometry } = parsed.pack;
  const syntheticEvidence = graph.assertions.some(assertion =>
    assertion.source.sourceType === 'synthetic'
    || assertion.source.assignmentAuthority === 'synthetic_fixture_assignment'
    || assertion.source.geometryAuthority === 'synthetic_fixture_geometry')
    || geometry.features.some(feature =>
      feature.source.sourceType === 'synthetic'
      || feature.source.assignmentAuthority === 'synthetic_fixture_assignment'
      || feature.source.geometryAuthority === 'synthetic_fixture_geometry');
  if (descriptor.synthetic !== syntheticEvidence) fail('descriptor-synthetic-provenance-mismatch');
  if (syntheticEvidence
    && (descriptor.maturity !== 'M2_experimental' || descriptor.promotionEligible)) {
    fail('synthetic-promotion-policy-invalid');
  }
  if (descriptor.repositoryId !== graph.release.repositoryId
    || descriptor.countryCode !== graph.release.countryCode
    || descriptor.countryCode !== geometry.countryCode
    || descriptor.releaseId !== graph.release.releaseId
    || descriptor.releaseId !== geometry.releaseId
    || descriptor.policyVersion !== graph.release.policyVersion) fail('descriptor-artifact-identity-mismatch');
  if (descriptor.graphManifestDigest !== graph.release.manifestDigest
    || descriptor.graphManifestDigest !== computePostalContextGraphManifestDigest(graph.release)) {
    fail('graph-manifest-digest-mismatch');
  }
  const graphArtifact = artifacts.get('graph')!.descriptor;
  const geometryArtifact = artifacts.get('geometry')!.descriptor;
  if (graphArtifact.schemaVersion !== POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION
    || graphArtifact.mediaType !== 'application/vnd.agid.postal-context-graph+json'
    || geometryArtifact.schemaVersion !== POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION
    || geometryArtifact.mediaType !== 'application/vnd.agid.postal-context-geometry+json') {
    fail('descriptor-artifact-contract-mismatch');
  }
  if (graphArtifact.recordCounts.nodes !== parsed.counts.nodes
    || graphArtifact.recordCounts.assertions !== parsed.counts.assertions
    || geometryArtifact.recordCounts.features !== parsed.counts.features
    || geometryArtifact.recordCounts.positions !== parsed.counts.positions) {
    fail('descriptor-record-count-mismatch');
  }
  const manifestGeometry = graph.release.artifacts.find(artifact => artifact.path === geometryArtifact.path);
  if (!manifestGeometry
    || manifestGeometry.digest !== geometryArtifact.digest
    || manifestGeometry.mediaType !== geometryArtifact.mediaType
    || manifestGeometry.byteLength !== geometryArtifact.byteLength) {
    fail('graph-manifest-geometry-artifact-mismatch');
  }
  return {
    pack: parsed.pack,
    warnings: parsed.warnings,
    attestation: {
      descriptorDigest,
      sequence: descriptor.sequence,
      maturity: descriptor.maturity,
      synthetic: descriptor.synthetic,
      promotionEligible: descriptor.promotionEligible,
      servingMode: descriptor.maturity === 'M4_stable'
        ? 'stable'
        : descriptor.maturity === 'M3_candidate'
          ? 'candidate'
          : 'experimental',
      integrity: 'externally_pinned',
    } satisfies PostalContextRuntimeAttestation,
  };
}

export function loadPostalContextPack(
  descriptorPath: string,
  expectedDescriptorDigest: string,
  options: PostalContextPackLoadOptions,
): PostalContextLoadedPack {
  if (!SHA256.test(expectedDescriptorDigest)) fail('expected-descriptor-digest-invalid');
  const expectedCountryCode = options.expectedCountryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(expectedCountryCode)) fail('expected-country-invalid');

  const descriptorFile = readBoundedRegularFile(descriptorPath, DESCRIPTOR_MAX_BYTES);
  const actualDescriptorDigest = sha256(descriptorFile.bytes);
  if (actualDescriptorDigest !== expectedDescriptorDigest) fail('descriptor-digest-mismatch');
  const descriptor = parseDescriptor(parseStrictJson(descriptorFile.bytes));
  if (descriptor.countryCode !== expectedCountryCode) fail('descriptor-country-mismatch');
  if (descriptor.synthetic && !options.allowSynthetic) fail('synthetic-pack-not-enabled');
  if (descriptor.maturity === 'M2_experimental' && !options.allowExperimental) {
    fail('experimental-pack-not-enabled');
  }
  if (!descriptor.promotionEligible && descriptor.maturity !== 'M2_experimental') {
    fail('non-promotable-candidate-or-stable-pack');
  }

  const rootDirectory = realpathSync(dirname(descriptorFile.realPath));
  const artifacts = new Map<'graph' | 'geometry', {
    descriptor: PostalContextPackArtifactDescriptor;
    value: unknown;
  }>();
  for (const artifact of descriptor.artifacts) {
    const artifactFile = readBoundedRegularFile(
      resolve(rootDirectory, artifact.path),
      artifact.role === 'graph'
        ? POSTAL_CONTEXT_PACK_LIMITS.graphBytes
        : POSTAL_CONTEXT_PACK_LIMITS.geometryBytes,
      rootDirectory,
    );
    if (artifactFile.bytes.byteLength !== artifact.byteLength) fail('artifact-byte-length-mismatch');
    if (sha256(artifactFile.bytes) !== artifact.digest) fail('artifact-digest-mismatch');
    artifacts.set(artifact.role, {
      descriptor: artifact,
      value: parseStrictJson(artifactFile.bytes),
    });
  }

  const validated = crossValidateDescriptor(
    descriptor,
    actualDescriptorDigest,
    artifacts,
    expectedCountryCode,
  );
  return {
    runtime: new PostalContextPackRuntime(validated.pack, {
      countryCode: expectedCountryCode,
      attestation: validated.attestation,
    }),
    descriptor,
    descriptorDigest: actualDescriptorDigest,
    warnings: validated.warnings,
  };
}

function enabled(value: string | undefined) {
  return /^(1|true|yes|on)$/i.test(value?.trim() ?? '');
}

function errorCode(error: unknown) {
  return error instanceof PostalContextPackLoadError
    ? error.code
    : 'postal-context-pack-load-failed';
}

export function createConfiguredPostalContextPackStore(
  environment: NodeJS.ProcessEnv = process.env,
): PostalContextPackStore {
  const countryCode = 'JP';
  const descriptorPath = environment.AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_PATH?.trim() ?? '';
  const descriptorDigest = environment.AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_DIGEST?.trim() ?? '';
  const fallbackPath = environment.AGID_POSTAL_CONTEXT_JP_LKG_DESCRIPTOR_PATH?.trim() ?? '';
  const fallbackDigest = environment.AGID_POSTAL_CONTEXT_JP_LKG_DESCRIPTOR_DIGEST?.trim() ?? '';
  const allowExperimental = enabled(environment.AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL);
  const allowSynthetic = enabled(environment.AGID_POSTAL_CONTEXT_ALLOW_SYNTHETIC);
  let runtime: PostalContextPackRuntime | undefined;
  const errors: string[] = [];
  const warnings: string[] = [];
  let state: PostalContextPackStoreCountryStatus['state'] = 'unconfigured';

  if (Boolean(descriptorPath) !== Boolean(descriptorDigest)) {
    state = 'invalid';
    errors.push('active-pack-configuration-incomplete');
  } else if (descriptorPath && descriptorDigest) {
    try {
      const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, {
        expectedCountryCode: countryCode,
        allowExperimental,
        allowSynthetic,
      });
      runtime = loaded.runtime;
      warnings.push(...loaded.warnings);
      state = 'ready';
    } catch (error) {
      errors.push(`active:${errorCode(error)}`);
      state = 'invalid';
    }
  }

  if (!runtime && (fallbackPath || fallbackDigest)) {
    if (!fallbackPath || !fallbackDigest) {
      errors.push('lkg-pack-configuration-incomplete');
      state = 'invalid';
    } else {
      try {
        const loaded = loadPostalContextPack(fallbackPath, fallbackDigest, {
          expectedCountryCode: countryCode,
          allowExperimental,
          allowSynthetic,
        });
        runtime = loaded.runtime;
        warnings.push('active-pack-unavailable-serving-verified-lkg', ...loaded.warnings);
        state = 'degraded_lkg';
      } catch (error) {
        errors.push(`lkg:${errorCode(error)}`);
        state = 'invalid';
      }
    }
  }

  const status = (): PostalContextPackStoreCountryStatus => ({
    countryCode,
    state,
    runtime: runtime?.status(),
    errors: [...errors],
    warnings: [...new Set(warnings)],
  });
  return {
    getRuntime(requestedCountryCode) {
      return requestedCountryCode.toUpperCase() === countryCode ? runtime : undefined;
    },
    countryStatus(requestedCountryCode) {
      if (requestedCountryCode.toUpperCase() === countryCode) return status();
      return {
        countryCode: requestedCountryCode.toUpperCase(),
        state: 'unconfigured',
        errors: ['unsupported-country'],
        warnings: [],
      };
    },
    statuses() {
      return [status()];
    },
  };
}

export function createInMemoryPostalContextPackStore(
  runtime: PostalContextPackRuntime,
): PostalContextPackStore {
  return {
    getRuntime(countryCode) {
      return countryCode.toUpperCase() === runtime.countryCode ? runtime : undefined;
    },
    countryStatus(countryCode) {
      if (countryCode.toUpperCase() !== runtime.countryCode) {
        return {
          countryCode: countryCode.toUpperCase(),
          state: 'unconfigured',
          errors: ['unsupported-country'],
          warnings: [],
        };
      }
      return {
        countryCode: runtime.countryCode,
        state: 'ready',
        runtime: runtime.status(),
        errors: [],
        warnings: [],
      };
    },
    statuses() {
      return [this.countryStatus(runtime.countryCode)];
    },
  };
}
